const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

/**
 * Email service for sending notifications
 */

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const templates = {
  welcome: (user) => ({
    subject: 'مرحباً بك في عصيني - Welcome to Ess9ini',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">مرحباً بك في عصيني</h1>
          <h2 style="color: white; margin: 10px 0 0 0; font-weight: normal;">Welcome to Ess9ini Smart Farm</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h3>مرحباً ${user.firstName}!</h3>
          <p>نرحب بك في منصة عصيني للزراعة الذكية. حسابك جاهز الآن للاستخدام.</p>
          
          <h3>Hello ${user.firstName}!</h3>
          <p>Welcome to Ess9ini Smart Farming platform. Your account is now ready to use.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>معلومات الحساب - Account Information:</h4>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Language:</strong> ${user.language}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              🚿 الذهاب إلى لوحة التحكم - Go to Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.<br>
            If you have any questions, feel free to contact us.
          </p>
        </div>
      </div>
    `
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'إعادة تعيين كلمة المرور - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">إعادة تعيين كلمة المرور</h1>
          <h2 style="color: white; margin: 10px 0 0 0; font-weight: normal;">Password Reset Request</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h3>مرحباً ${user.firstName}!</h3>
          <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.</p>
          
          <h3>Hello ${user.firstName}!</h3>
          <p>We received a request to reset your password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" 
               style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              🔑 إعادة تعيين كلمة المرور - Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            هذا الرابط صالح لمدة 10 دقائق فقط.<br>
            This link is valid for 10 minutes only.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.<br>
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `
  }),

  alertNotification: (user, alert) => ({
    subject: `تنبيه ${alert.severity} - ${alert.type} Alert`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${alert.severity === 'critical' ? '#e74c3c' : '#f39c12'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 تنبيه من مزرعتك</h1>
          <h2 style="color: white; margin: 10px 0 0 0; font-weight: normal;">Farm Alert Notification</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${alert.severity === 'critical' ? '#e74c3c' : '#f39c12'};">
            <h3 style="margin-top: 0; color: ${alert.severity === 'critical' ? '#e74c3c' : '#f39c12'};">
              ${alert.severity.toUpperCase()} - ${alert.type.replace('_', ' ').toUpperCase()}
            </h3>
            <p><strong>الرسالة - Message:</strong> ${alert.message}</p>
            <p><strong>الوقت - Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            ${alert.sensorId ? `<p><strong>المستشعر - Sensor:</strong> ${alert.sensorId}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              🔍 عرض التفاصيل - View Details
            </a>
          </div>
        </div>
      </div>
    `
  }),

  irrigationComplete: (user, irrigation) => ({
    subject: 'اكتمال الري - Irrigation Completed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #27ae60; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ اكتمل الري بنجاح</h1>
          <h2 style="color: white; margin: 10px 0 0 0; font-weight: normal;">Irrigation Completed Successfully</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #27ae60;">تفاصيل الري - Irrigation Details</h3>
            <p><strong>المناطق - Zones:</strong> ${irrigation.zones.join(', ')}</p>
            <p><strong>المدة - Duration:</strong> ${irrigation.actualDuration || irrigation.duration} دقيقة</p>
            <p><strong>كمية المياه - Water Used:</strong> ${irrigation.results?.waterUsed || 'N/A'} لتر</p>
            <p><strong>الكفاءة - Efficiency:</strong> ${irrigation.results?.efficiency || 'N/A'}%</p>
            <p><strong>وقت البداية - Start Time:</strong> ${new Date(irrigation.schedule.actualStartTime).toLocaleString()}</p>
            <p><strong>وقت الانتهاء - End Time:</strong> ${new Date(irrigation.schedule.actualEndTime).toLocaleString()}</p>
          </div>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    const emailContent = templates[template](data);
    
    const mailOptions = {
      from: `"Ess9ini Smart Farm" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      to,
      template,
      messageId: result.messageId
    });
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      template,
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  return await sendEmail(user.email, 'welcome', user);
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  return await sendEmail(user.email, 'passwordReset', { user, resetToken });
};

// Send alert notification
const sendAlertNotification = async (user, alert) => {
  if (!user.profile?.notifications?.email) {
    return { success: false, reason: 'Email notifications disabled' };
  }
  
  return await sendEmail(user.email, 'alertNotification', { user, alert });
};

// Send irrigation completion notification
const sendIrrigationCompleteEmail = async (user, irrigation) => {
  if (!user.profile?.notifications?.email) {
    return { success: false, reason: 'Email notifications disabled' };
  }
  
  return await sendEmail(user.email, 'irrigationComplete', { user, irrigation });
};

// Send bulk emails
const sendBulkEmails = async (recipients, template, data = {}) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient.email, template, { ...data, user: recipient });
    results.push({
      email: recipient.email,
      success: result.success,
      error: result.error
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    logger.success('Email configuration is valid');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    logger.error('Email configuration test failed', { error: error.message });
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAlertNotification,
  sendIrrigationCompleteEmail,
  sendBulkEmails,
  testEmailConfig
};
