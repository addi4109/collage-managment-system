import Notification from '../models/Notification.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import User from '../models/User.js';

// Single recipient
export const createNotification = async (recipientId, title, message, type, senderId = null) => {
  try {
    const notif = new Notification({ recipientId, senderId, title, message, type, read: false });
    return await notif.save();
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// Batch: by dept + year (students only)
export const createBatchNotifications = async (departmentId, year, semester, title, message, type, senderId = null) => {
  try {
    const query = { departmentId, year, isDeleted: false };
    if (semester) query.semester = semester;
    const students = await Student.find(query);
    const notifications = students.map(s => ({
      recipientId: s.userId,
      senderId,
      title,
      message,
      type,
      read: false,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    return notifications.length;
  } catch (err) {
    console.error('Failed to dispatch batch notifications:', err.message);
    return 0;
  }
};

// All users of a role (student / faculty / admin)
export const createRoleNotifications = async (role, title, message, type, senderId = null) => {
  try {
    const users = await User.find({ role, isDeleted: false });
    const notifications = users.map(u => ({
      recipientId: u._id,
      senderId,
      title,
      message,
      type,
      read: false,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    return notifications.length;
  } catch (err) {
    console.error('Failed to dispatch role notifications:', err.message);
    return 0;
  }
};

// Multiple user IDs at once
export const createMultiNotifications = async (recipientIds, title, message, type, senderId = null) => {
  try {
    const notifications = recipientIds.map(id => ({
      recipientId: id,
      senderId,
      title,
      message,
      type,
      read: false,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    return notifications.length;
  } catch (err) {
    console.error('Failed to dispatch multi notifications:', err.message);
    return 0;
  }
};

export const getNotifications = async (userId) => {
  return await Notification.find({ recipientId: userId })
    .populate('senderId', 'name role')
    .sort({ createdAt: -1 })
    .limit(50);
};

export const markRead = async (notificationId, userId) => {
  const notif = await Notification.findOne({ _id: notificationId, recipientId: userId });
  if (notif) { notif.read = true; await notif.save(); }
  return notif;
};

export const markAllRead = async (userId) => {
  await Notification.updateMany({ recipientId: userId, read: false }, { read: true });
  return { success: true };
};

// Get sent notifications (by sender)
export const getSentNotifications = async (senderId) => {
  return await Notification.find({ senderId })
    .populate('recipientId', 'name role')
    .sort({ createdAt: -1 })
    .limit(100);
};
