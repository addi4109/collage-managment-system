import * as notificationService from '../services/notificationService.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import User from '../models/User.js';

export const listMyNotifications = async (req, res) => {
  try {
    const list = await notificationService.getNotifications(req.user.id);
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve notifications.' });
  }
};

export const read = async (req, res) => {
  try {
    const notif = await notificationService.markRead(req.params.id, req.user.id);
    res.status(200).json({ message: 'Notification marked as read.', notif });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const readAll = async (req, res) => {
  try {
    await notificationService.markAllRead(req.user.id);
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear notifications.' });
  }
};

// GET /notifications/sent - messages sent by this user
export const getSent = async (req, res) => {
  try {
    const list = await notificationService.getSentNotifications(req.user.id);
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve sent notifications.' });
  }
};

/**
 * POST /notifications/send
 * Body:
 *  - title, message  (required)
 *  - target: 'all_students' | 'all_faculty' | 'batch' | 'individual'
 *  - departmentId, year, semester  (for batch)
 *  - recipientId  (for individual — User _id)
 */
export const sendNotification = async (req, res) => {
  try {
    const { title, message, target, departmentId, year, semester, recipientId } = req.body;
    const senderId = req.user.id;
    const role = req.user.role;

    if (!title || !message || !target) {
      return res.status(400).json({ message: 'title, message, and target are required.' });
    }

    let count = 0;

    if (target === 'all_students') {
      if (role !== 'admin') return res.status(403).json({ message: 'Only admin can message all students.' });
      count = await notificationService.createRoleNotifications('student', title, message, 'ANNOUNCEMENT', senderId);

    } else if (target === 'all_faculty') {
      if (role !== 'admin') return res.status(403).json({ message: 'Only admin can message all faculty.' });
      count = await notificationService.createRoleNotifications('faculty', title, message, 'ANNOUNCEMENT', senderId);

    } else if (target === 'all_staff') {
      // Admin sends to both students and faculty
      if (role !== 'admin') return res.status(403).json({ message: 'Only admin can broadcast to all.' });
      const s = await notificationService.createRoleNotifications('student', title, message, 'ANNOUNCEMENT', senderId);
      const f = await notificationService.createRoleNotifications('faculty', title, message, 'ANNOUNCEMENT', senderId);
      count = s + f;

    } else if (target === 'batch') {
      if (!departmentId || !year) {
        return res.status(400).json({ message: 'departmentId and year are required for batch notifications.' });
      }
      // Faculty can only send to their assigned depts/years
      if (role === 'faculty') {
        const facultyProfile = await Faculty.findOne({ userId: senderId, isDeleted: false });
        if (!facultyProfile) return res.status(403).json({ message: 'Faculty profile not found.' });
        const assignedDepts = facultyProfile.assignedDepartments.map(d => d.toString());
        if (!assignedDepts.includes(departmentId)) {
          return res.status(403).json({ message: 'Department is outside your assigned scope.' });
        }
      }
      count = await notificationService.createBatchNotifications(departmentId, year, semester || null, title, message, 'ANNOUNCEMENT', senderId);

    } else if (target === 'individual') {
      if (!recipientId) return res.status(400).json({ message: 'recipientId is required for individual notifications.' });
      const recipient = await User.findOne({ _id: recipientId, isDeleted: false });
      if (!recipient) return res.status(404).json({ message: 'Recipient user not found.' });
      await notificationService.createNotification(recipientId, title, message, 'ANNOUNCEMENT', senderId);
      count = 1;

    } else {
      return res.status(400).json({ message: 'Invalid target type.' });
    }

    res.status(201).json({ message: `Notification sent to ${count} recipient(s).`, count });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ message: err.message || 'Failed to send notification.' });
  }
};

// GET /notifications/recipients?role=student|faculty  — list users to pick individual recipient
export const listRecipients = async (req, res) => {
  try {
    const { role } = req.query;
    const query = { isDeleted: false };
    if (role) query.role = role;
    else query.role = { $in: ['student', 'faculty'] };

    const users = await User.find(query).select('name username role email').limit(200);
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list recipients.' });
  }
};
