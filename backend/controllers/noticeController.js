import Notice from '../models/Notice.js';

// Create a new notice
export const createNotice = async (req, res) => {
  const { title, message, priority } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  // Ensure role is either faculty or admin
  if (!['faculty', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden. Only faculty and admins can publish notices.' });
  }

  try {
    const newNotice = new Notice({
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user.id,
      createdByName: req.user.name,
      role: req.user.role,
      priority: priority || 'low',
    });

    const savedNotice = await newNotice.save();
    res.status(201).json(savedNotice);
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: 'Internal server error creating notice.' });
  }
};

// Get all notices, sorted by newest first
export const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    res.status(500).json({ message: 'Internal server error fetching notices.' });
  }
};

// Delete a notice
export const deleteNotice = async (req, res) => {
  const { id } = req.params;

  try {
    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found.' });
    }

    // Only owner of the notice or an admin can delete
    const isOwner = notice.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own notices.' });
    }

    await Notice.findByIdAndDelete(id);
    res.json({ message: 'Notice deleted successfully.' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ message: 'Internal server error deleting notice.' });
  }
};
