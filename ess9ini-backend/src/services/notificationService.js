/**
 * Notification service for sending alerts via multiple channels
 */

const { logger } = require('../utils/logger');
const emailService = require('./emailService');

// In-memory notification queue (in production, use Redis or similar)
const notificationQueue = [];
const activeNotifications = new Map();

// Notification types
const NOTIFICATION_TYPES = {
  ALERT: 'alert',
  IRRIGATION: 'irrigation',
  SYSTEM: 'system',
  MAINTENANCE: 'maintenance',
  WEATHER: 'weather'
};

// Notification channels
const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app'
};

// Create notification
const createNotification = (type, title, message, data = {}) => {
  return {
    id: generateNotificationId(),
    type,
    title,
    message,
    data,
    channels: [],
    recipients: [],
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    scheduledAt: data.scheduledAt || new Date(),
    sentAt: null,
    error: null
  };
};

// Generate unique notification ID
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Add notification to queue
const queueNotification = (notification) => {
  notificationQueue.push(notification);
  logger.debug('Notification queued', {
    id: notification.id,
    type: notification.type,
    recipients: notification.recipients.length
  });
};

// Send alert notification
const sendAlert = async (alert, users, channels = [CHANNELS.EMAIL, CHANNELS.IN_APP]) => {
  try {
    const notification = createNotification(
      NOTIFICATION_TYPES.ALERT,
      `${alert.severity.toUpperCase()} Alert: ${alert.type}`,
      alert.message,
      {
        alertId: alert._id,
        farmId: alert.farmId,
        severity: alert.severity,
        category: alert.category
      }
    );

    notification.channels = channels;
    notification.recipients = users.map(user => ({
      userId: user._id,
      email: user.email,
      phone: user.phone,
      preferences: user.profile?.notifications || {}
    }));

    queueNotification(notification);
    await processNotificationQueue();

    return { success: true, notificationId: notification.id };
  } catch (error) {
    logger.error('Failed to send alert notification', {
      error: error.message,
      alertId: alert._id
    });
    return { success: false, error: error.message };
  }
};

// Send irrigation notification
const sendIrrigationNotification = async (irrigation, users, type = 'started') => {
  try {
    const titles = {
      started: 'Irrigation Started',
      completed: 'Irrigation Completed',
      failed: 'Irrigation Failed',
      scheduled: 'Irrigation Scheduled'
    };

    const messages = {
      started: `Irrigation started for zones ${irrigation.zones.join(', ')} - Duration: ${irrigation.duration} minutes`,
      completed: `Irrigation completed successfully - Water used: ${irrigation.results?.waterUsed || 'N/A'} liters`,
      failed: `Irrigation failed - ${irrigation.error || 'Unknown error'}`,
      scheduled: `Irrigation scheduled for ${new Date(irrigation.schedule.startTime).toLocaleString()}`
    };

    const notification = createNotification(
      NOTIFICATION_TYPES.IRRIGATION,
      titles[type],
      messages[type],
      {
        irrigationId: irrigation._id,
        farmId: irrigation.farmId,
        type,
        zones: irrigation.zones,
        duration: irrigation.duration
      }
    );

    notification.channels = [CHANNELS.EMAIL, CHANNELS.IN_APP];
    notification.recipients = users.map(user => ({
      userId: user._id,
      email: user.email,
      phone: user.phone,
      preferences: user.profile?.notifications || {}
    }));

    queueNotification(notification);
    await processNotificationQueue();

    return { success: true, notificationId: notification.id };
  } catch (error) {
    logger.error('Failed to send irrigation notification', {
      error: error.message,
      irrigationId: irrigation._id
    });
    return { success: false, error: error.message };
  }
};

// Send system notification
const sendSystemNotification = async (title, message, users, data = {}) => {
  try {
    const notification = createNotification(
      NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      data
    );

    notification.channels = [CHANNELS.EMAIL, CHANNELS.IN_APP];
    notification.recipients = users.map(user => ({
      userId: user._id,
      email: user.email,
      phone: user.phone,
      preferences: user.profile?.notifications || {}
    }));

    queueNotification(notification);
    await processNotificationQueue();

    return { success: true, notificationId: notification.id };
  } catch (error) {
    logger.error('Failed to send system notification', {
      error: error.message
    });
    return { success: false, error: error.message };
  }
};

// Process notification queue
const processNotificationQueue = async () => {
  while (notificationQueue.length > 0) {
    const notification = notificationQueue.shift();
    
    // Check if it's time to send
    if (notification.scheduledAt > new Date()) {
      // Put back in queue for later
      notificationQueue.push(notification);
      continue;
    }

    await sendNotification(notification);
  }
};

// Send individual notification
const sendNotification = async (notification) => {
  try {
    notification.status = 'sending';
    notification.attempts++;

    const results = [];

    for (const recipient of notification.recipients) {
      for (const channel of notification.channels) {
        // Check user preferences
        if (!shouldSendToChannel(recipient, channel, notification.type)) {
          continue;
        }

        const result = await sendToChannel(notification, recipient, channel);
        results.push(result);
      }
    }

    // Update notification status
    const successCount = results.filter(r => r.success).length;
    const totalAttempts = results.length;

    if (successCount === totalAttempts) {
      notification.status = 'sent';
      notification.sentAt = new Date();
    } else if (successCount > 0) {
      notification.status = 'partial';
      notification.sentAt = new Date();
    } else {
      notification.status = 'failed';
      notification.error = 'All delivery attempts failed';
    }

    // Store notification for tracking
    activeNotifications.set(notification.id, notification);

    logger.info('Notification processed', {
      id: notification.id,
      status: notification.status,
      successCount,
      totalAttempts
    });

  } catch (error) {
    notification.status = 'failed';
    notification.error = error.message;
    
    logger.error('Failed to send notification', {
      id: notification.id,
      error: error.message
    });
  }
};

// Check if notification should be sent to specific channel
const shouldSendToChannel = (recipient, channel, notificationType) => {
  const preferences = recipient.preferences;
  
  if (!preferences) return true; // Default to sending if no preferences

  switch (channel) {
    case CHANNELS.EMAIL:
      return preferences.email !== false;
    case CHANNELS.SMS:
      return preferences.sms === true && recipient.phone;
    case CHANNELS.PUSH:
      return preferences.push !== false;
    case CHANNELS.IN_APP:
      return true; // Always send in-app notifications
    default:
      return false;
  }
};

// Send to specific channel
const sendToChannel = async (notification, recipient, channel) => {
  try {
    switch (channel) {
      case CHANNELS.EMAIL:
        return await sendEmailNotification(notification, recipient);
      case CHANNELS.SMS:
        return await sendSMSNotification(notification, recipient);
      case CHANNELS.PUSH:
        return await sendPushNotification(notification, recipient);
      case CHANNELS.IN_APP:
        return await sendInAppNotification(notification, recipient);
      default:
        return { success: false, error: 'Unknown channel' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send email notification
const sendEmailNotification = async (notification, recipient) => {
  try {
    let result;

    switch (notification.type) {
      case NOTIFICATION_TYPES.ALERT:
        result = await emailService.sendAlertNotification(recipient, {
          ...notification.data,
          message: notification.message,
          timestamp: notification.createdAt
        });
        break;
      case NOTIFICATION_TYPES.IRRIGATION:
        result = await emailService.sendIrrigationCompleteEmail(recipient, notification.data);
        break;
      default:
        // Generic email template
        result = await emailService.sendEmail(recipient.email, 'generic', {
          title: notification.title,
          message: notification.message,
          user: recipient
        });
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send SMS notification (placeholder - integrate with SMS service)
const sendSMSNotification = async (notification, recipient) => {
  // Placeholder for SMS integration (Twilio, etc.)
  logger.debug('SMS notification would be sent', {
    phone: recipient.phone,
    message: notification.message
  });
  
  return { success: true, channel: 'sms' };
};

// Send push notification (placeholder - integrate with push service)
const sendPushNotification = async (notification, recipient) => {
  // Placeholder for push notification integration (Firebase, etc.)
  logger.debug('Push notification would be sent', {
    userId: recipient.userId,
    title: notification.title,
    message: notification.message
  });
  
  return { success: true, channel: 'push' };
};

// Send in-app notification
const sendInAppNotification = async (notification, recipient) => {
  // Store in database for in-app display
  // This would typically save to a notifications collection
  logger.debug('In-app notification stored', {
    userId: recipient.userId,
    notificationId: notification.id
  });
  
  return { success: true, channel: 'in_app' };
};

// Get user notifications
const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    // In production, this would query the database
    const userNotifications = Array.from(activeNotifications.values())
      .filter(notification => 
        notification.recipients.some(recipient => 
          recipient.userId.toString() === userId.toString()
        )
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);

    return {
      success: true,
      data: userNotifications,
      total: userNotifications.length
    };
  } catch (error) {
    logger.error('Failed to get user notifications', {
      userId,
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = activeNotifications.get(notificationId);
    
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    // In production, update database record
    logger.debug('Notification marked as read', {
      notificationId,
      userId
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to mark notification as read', {
      notificationId,
      userId,
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
};

// Start notification processor (run periodically)
const startNotificationProcessor = () => {
  setInterval(async () => {
    if (notificationQueue.length > 0) {
      await processNotificationQueue();
    }
  }, 5000); // Process every 5 seconds

  logger.info('Notification processor started');
};

module.exports = {
  NOTIFICATION_TYPES,
  CHANNELS,
  sendAlert,
  sendIrrigationNotification,
  sendSystemNotification,
  getUserNotifications,
  markAsRead,
  startNotificationProcessor
};
