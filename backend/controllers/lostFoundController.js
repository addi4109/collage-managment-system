import * as lostFoundService from '../services/lostFoundService.js';

export const create = async (req, res) => {
  try {
    const attachments = [];
    if (req.files) {
      req.files.forEach((f) => {
        attachments.push({ filename: f.originalname, fileUrl: `/uploads/${f.filename}` });
      });
    } else if (req.file) {
      attachments.push({ filename: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
    }

    const entryData = {
      ...req.body,
      attachments,
    };

    const item = await lostFoundService.createEntry(entryData, req.user.id, req.user);
    res.status(201).json({ message: 'Item entry posted successfully.', item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const list = async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      departmentId: req.query.departmentId,
    };
    const items = await lostFoundService.getEntries(filters, req.user);
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving lost & found items.' });
  }
};

export const reply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Reply message content is required.' });
    }
    const item = await lostFoundService.addReply(req.params.id, req.user.id, req.user.name, req.user.role, message);
    res.status(200).json({ message: 'Reply added successfully.', item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const resolve = async (req, res) => {
  try {
    const item = await lostFoundService.resolveEntry(req.params.id, req.user);
    res.status(200).json({ message: 'Item status set to resolved.', item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await lostFoundService.deleteEntry(req.params.id, req.user);
    res.status(200).json({ message: 'Lost & Found entry deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
