import AuditLog from '../models/AuditLog.js';

export const logActivity = async ({ action, performedBy, targetId = null, details, ipAddress = '' }) => {
  try {
    const log = new AuditLog({
      action,
      performedBy,
      targetId,
      details,
      ipAddress,
    });
    await log.save();
  } catch (err) {
    console.error('Failed to save audit log entry:', err.message);
  }
};

export const getLogs = async (filters = {}, limit = 100, page = 1) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.action) query.action = filters.action;
  if (filters.userId) query.performedBy = filters.userId;

  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  return { logs, total, page, limit };
};
