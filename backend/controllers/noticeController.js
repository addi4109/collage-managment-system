import * as noticeService from '../services/noticeService.js';

export const createNotice = async (req, res) => {
  try {
    const attachments = [];
    if (req.files) {
      req.files.forEach((f) => {
        attachments.push({ filename: f.originalname, fileUrl: `/uploads/${f.filename}` });
      });
    } else if (req.file) {
      attachments.push({ filename: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
    }

    const noticeData = {
      ...req.body,
      attachments,
    };

    const notice = await noticeService.createNotice(noticeData, req.user.id, req.user);
    res.status(201).json({ message: 'Notice posted successfully.', notice });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getNotices = async (req, res) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      year: req.query.year,
      semester: req.query.semester,
      category: req.query.category,
      priority: req.query.priority,
    };
    const notices = await noticeService.getNotices(filters, req.user);
    res.status(200).json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving notices.' });
  }
};

export const editNotice = async (req, res) => {
  try {
    const attachments = [];
    if (req.files) {
      req.files.forEach((f) => {
        attachments.push({ filename: f.originalname, fileUrl: `/uploads/${f.filename}` });
      });
    } else if (req.file) {
      attachments.push({ filename: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
    }

    const noticeData = {
      ...req.body,
    };
    if (attachments.length > 0) {
      noticeData.attachments = attachments;
    }

    const notice = await noticeService.updateNotice(req.params.id, noticeData, req.user);
    res.status(200).json({ message: 'Notice updated successfully.', notice });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const removeNotice = async (req, res) => {
  try {
    await noticeService.deleteNotice(req.params.id, req.user);
    res.status(200).json({ message: 'Notice deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const noticeRead = await noticeService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ message: 'Notice marked as read.', noticeRead });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
