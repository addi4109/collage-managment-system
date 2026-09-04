import LostFound from '../models/LostFound.js';

export const createEntry = async (entryData, creatorId, requestUser) => {
  const { title, description, type, contactInfo, departmentId, year, semester, attachments } = entryData;

  const item = new LostFound({
    title,
    description,
    type,
    contactInfo,
    departmentId,
    year,
    semester,
    attachments: attachments || [],
    createdBy: creatorId,
    status: 'active',
  });

  return await item.save();
};

export const getEntries = async (filters = {}, requestUser) => {
  const query = { isDeleted: false };

  // Apply optional query-string filters (type, status, departmentId)
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.departmentId) query.departmentId = filters.departmentId;

  return await LostFound.find(query)
    .populate('departmentId', 'name code')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });
};

export const addReply = async (itemId, replierId, replierName, replierRole, message) => {
  const item = await LostFound.findOne({ _id: itemId, isDeleted: false });
  if (!item) {
    throw new Error('Lost & Found item not found.');
  }

  item.replies.push({
    replierId,
    replierName,
    replierRole,
    message,
  });

  return await item.save();
};

export const deleteEntry = async (itemId, requestUser) => {
  const item = await LostFound.findOne({ _id: itemId, isDeleted: false });
  if (!item) {
    throw new Error('Lost & Found item not found.');
  }

  // Restrict deletions: only creator or admin can delete
  if (requestUser.role !== 'admin' && item.createdBy.toString() !== requestUser.id) {
    throw new Error('Forbidden: You do not have permission to delete this post.');
  }

  item.isDeleted = true;
  item.deletedAt = new Date();
  return await item.save();
};

export const resolveEntry = async (itemId, requestUser) => {
  const item = await LostFound.findOne({ _id: itemId, isDeleted: false });
  if (!item) {
    throw new Error('Lost & Found item not found.');
  }

  if (requestUser.role !== 'admin' && item.createdBy.toString() !== requestUser.id) {
    throw new Error('Forbidden: You do not have permission to resolve this post.');
  }

  item.status = 'resolved';
  return await item.save();
};
