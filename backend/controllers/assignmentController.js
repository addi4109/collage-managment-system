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
      department: req.user.role === 'faculty' ? req.user.activeDepartment : '',
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

    // Populate the faculty details (name, email)
    const assignments = await Assignment.find(filter)
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ message: 'Internal server error fetching assignments.' });
  }
};
