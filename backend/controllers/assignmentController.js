import Assignment from '../models/Assignment.js';

export const createAssignment = async (req, res) => {
  const { title, description, courseName, dueDate, attachment, attachmentName } = req.body;

  if (!title || !description || !courseName || !dueDate) {
    return res.status(400).json({ message: 'Title, description, course name, and due date are required.' });
  }

  try {
    const newAssignment = new Assignment({
      title,
      description,
      courseName,
      dueDate: new Date(dueDate),
      faculty: req.user.id,
      attachment: attachment || '',
      attachmentName: attachmentName || '',
    });

    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Internal server error creating assignment.' });
  }
};

export const getAssignments = async (req, res) => {
  try {
    // Populate the faculty details (name, email)
    const assignments = await Assignment.find()
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ message: 'Internal server error fetching assignments.' });
  }
};
