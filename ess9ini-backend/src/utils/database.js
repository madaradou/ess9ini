const mongoose = require('mongoose');

/**
 * Database utility functions
 */

// Check if MongoDB connection is ready
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get connection status
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Convert string to ObjectId
const toObjectId = (id) => {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new mongoose.Types.ObjectId(id);
};

// Pagination helper
const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Build aggregation pipeline for pagination
const buildPaginationPipeline = (page = 1, limit = 20, sortField = 'createdAt', sortOrder = -1) => {
  const skip = (page - 1) * limit;
  
  return [
    { $sort: { [sortField]: sortOrder } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    },
    {
      $project: {
        data: 1,
        totalCount: { $arrayElemAt: ['$totalCount.count', 0] },
        page: { $literal: page },
        limit: { $literal: limit },
        totalPages: {
          $ceil: {
            $divide: [
              { $arrayElemAt: ['$totalCount.count', 0] },
              limit
            ]
          }
        }
      }
    }
  ];
};

// Build date range filter
const buildDateRangeFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) filter[field].$lte = new Date(endDate);
  }
  
  return filter;
};

// Build search filter for text fields
const buildSearchFilter = (searchTerm, fields = []) => {
  if (!searchTerm || fields.length === 0) return {};
  
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return {
    $or: fields.map(field => ({
      [field]: searchRegex
    }))
  };
};

// Aggregate with lookup and pagination
const aggregateWithLookup = async (Model, pipeline, page = 1, limit = 20) => {
  const paginationPipeline = buildPaginationPipeline(page, limit);
  const fullPipeline = [...pipeline, ...paginationPipeline];
  
  const result = await Model.aggregate(fullPipeline);
  return result[0] || { data: [], totalCount: 0, page, limit, totalPages: 0 };
};

// Transaction helper
const withTransaction = async (operations) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const results = [];
    for (const operation of operations) {
      const result = await operation(session);
      results.push(result);
    }
    
    await session.commitTransaction();
    return results;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Bulk operations helper
const bulkWrite = async (Model, operations, options = {}) => {
  const defaultOptions = {
    ordered: false,
    bypassDocumentValidation: false
  };
  
  return await Model.bulkWrite(operations, { ...defaultOptions, ...options });
};

// Index management
const createIndexes = async (Model, indexes) => {
  try {
    for (const index of indexes) {
      await Model.createIndex(index.fields, index.options || {});
      console.log(`✅ Index created for ${Model.modelName}:`, index.fields);
    }
  } catch (error) {
    console.error(`❌ Error creating indexes for ${Model.modelName}:`, error.message);
  }
};

// Database health check
const healthCheck = async () => {
  try {
    const status = getConnectionStatus();
    const dbStats = await mongoose.connection.db.stats();
    
    return {
      status: 'healthy',
      connection: status,
      database: mongoose.connection.name,
      collections: dbStats.collections,
      dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      indexSize: `${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connection: getConnectionStatus(),
      error: error.message
    };
  }
};

// Clean up old documents
const cleanupOldDocuments = async (Model, field = 'createdAt', daysOld = 365) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await Model.deleteMany({
    [field]: { $lt: cutoffDate }
  });
  
  console.log(`🧹 Cleaned up ${result.deletedCount} old documents from ${Model.modelName}`);
  return result;
};

// Export statistics for a collection
const getCollectionStats = async (Model) => {
  try {
    const stats = await Model.collection.stats();
    const count = await Model.countDocuments();
    
    return {
      collection: Model.collection.name,
      count,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
      indexes: stats.nindexes,
      indexSize: `${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`
    };
  } catch (error) {
    return {
      collection: Model.collection.name,
      error: error.message
    };
  }
};

// Backup collection to JSON
const backupCollection = async (Model, filename) => {
  try {
    const documents = await Model.find({}).lean();
    const fs = require('fs');
    const path = require('path');
    
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filePath = path.join(backupDir, `${filename || Model.collection.name}_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
    
    console.log(`📦 Backup created: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Backup failed for ${Model.collection.name}:`, error.message);
    throw error;
  }
};

module.exports = {
  isConnected,
  getConnectionStatus,
  isValidObjectId,
  toObjectId,
  paginate,
  buildPaginationPipeline,
  buildDateRangeFilter,
  buildSearchFilter,
  aggregateWithLookup,
  withTransaction,
  bulkWrite,
  createIndexes,
  healthCheck,
  cleanupOldDocuments,
  getCollectionStats,
  backupCollection
};
