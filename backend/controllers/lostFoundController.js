import LostFound from '../models/LostFound.js';

// Create a new Lost & Found entry (Faculty only)
export const createLostFound = async (req, res) => {
  const { title, description, type, location, date, imageUrl } = req.body;

  if (!title || !description || !type || !date) {
    return res.status(400).json({ message: 'Title, description, type, and date are required.' });
  }

  if (!['lost', 'found'].includes(type)) {
    return res.status(400).json({ message: 'Type must be either lost or found.' });
  }

  try {
    const newEntry = new LostFound({
      title: title.trim(),
      description: description.trim(),
      type,
      location: location ? location.trim() : '',
      date: new Date(date),
      imageUrl: imageUrl || '',
      createdBy: req.user.id,
      department: req.user.role === 'faculty' ? req.user.activeDepartment : '',
      createdByName: req.user.name,
      replies: [],
      status: 'active',
    });

    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Create LostFound error:', error);
    res.status(500).json({ message: 'Internal server error creating entry.' });
  }
};

// Update an existing Lost & Found entry (Faculty owner only)
export const updateLostFound = async (req, res) => {
  const { id } = req.params;
  const { title, description, type, location, date, imageUrl, status } = req.body;

  try {
    const entry = await LostFound.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    // Verify ownership
    if (entry.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You are not the owner of this post.' });
    }

    if (title !== undefined) entry.title = title.trim();
    if (description !== undefined) entry.description = description.trim();
    if (type !== undefined) {
      if (!['lost', 'found'].includes(type)) {
        return res.status(400).json({ message: 'Type must be either lost or found.' });
      }
      entry.type = type;
    }
    if (location !== undefined) entry.location = location.trim();
    if (date !== undefined) entry.date = new Date(date);
    if (imageUrl !== undefined) entry.imageUrl = imageUrl;
    if (status !== undefined) {
      if (!['active', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Status must be active or resolved.' });
      }
      entry.status = status;
    }

    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    console.error('Update LostFound error:', error);
    res.status(500).json({ message: 'Internal server error updating entry.' });
  }
};

// Delete a Lost & Found entry (Faculty owner or Admin only)
export const deleteLostFound = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await LostFound.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    const isOwner = entry.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden. Only the owner or admin can delete this entry.' });
    }

    await LostFound.findByIdAndDelete(id);
    res.json({ message: 'Entry deleted successfully.' });
  } catch (error) {
    console.error('Delete LostFound error:', error);
    res.status(500).json({ message: 'Internal server error deleting entry.' });
  }
};

// Get all Lost & Found items (All roles)
export const getAllLostFound = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.$or = [
        { department: req.user.department },
        { department: '' },
        { department: { $exists: false } }
      ];
    } else if (req.user.role === 'faculty') {
      filter.$or = [
        { department: req.user.activeDepartment },
        { department: '' },
        { department: { $exists: false } }
      ];
    }
    const items = await LostFound.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Get all LostFound error:', error);
    res.status(500).json({ message: 'Internal server error fetching entries.' });
  }
};

// Add a reply message to an entry (Student reply)
export const addReply = async (req, res) => {
  const { id } = req.params;
  const { message, contactInfo } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const entry = await LostFound.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    const newReply = {
      studentId: req.user.id,
      studentName: req.user.name,
      message: message.trim(),
      contactInfo: contactInfo ? contactInfo.trim() : '',
      createdAt: new Date(),
    };

    entry.replies.push(newReply);
    await entry.save();

    res.status(201).json({ message: 'Reply sent successfully.', reply: newReply });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Internal server error sending reply.' });
  }
};

// Get all replies for a specific post (Faculty owner or Admin only)
export const getReplies = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await LostFound.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    const isOwner = entry.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden. Only the owner or admin can view replies.' });
    }

    res.json(entry.replies);
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Internal server error fetching replies.' });
  }
};
