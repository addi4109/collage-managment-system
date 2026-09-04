import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, module, details = '') => {
  try {
    const log = new ActivityLog({
      userId,
      action,
      module,
      details,
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

export const getActivityLogs = async (filters = {}, limit = 50, page = 1) => {
  try {
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.module) query.module = filters.module;
    if (filters.action) query.action = filters.action;

    const skip = (page - 1) * limit;
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(query);
    return { logs, total, page, limit };
  } catch (err) {
    console.error('Failed to retrieve activity logs:', err.message);
    throw err;
  }
};
