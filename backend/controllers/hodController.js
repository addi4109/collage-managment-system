import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Department from '../models/Department.js';

export const getHodStats = async (req, res) => {
  try {
    const deptId = req.user.departmentId;
    if (!deptId) return res.status(400).json({ message: 'HOD is not assigned to any department.' });

    const facultyCount = await Faculty.countDocuments({ assignedDepartments: deptId, isDeleted: false });
    const studentCount = await Student.countDocuments({ departmentId: deptId, isDeleted: false });
    
    // You can expand this to include pending applications, upcoming exams, etc.
    res.status(200).json({
      facultyCount,
      studentCount,
      departmentName: req.user.departmentName,
    });
  } catch (error) {
    console.error('getHodStats Error:', error);
    res.status(500).json({ message: 'Failed to fetch HOD stats' });
  }
};

export const getDeptFaculty = async (req, res) => {
  try {
    const deptId = req.user.departmentId;
    const faculty = await Faculty.find({ assignedDepartments: deptId, isDeleted: false })
      .populate('userId', 'name email status');
    res.status(200).json(faculty);
  } catch (error) {
    console.error('getDeptFaculty Error:', error);
    res.status(500).json({ message: 'Failed to fetch faculty' });
  }
};

export const getDeptStudents = async (req, res) => {
  try {
    const deptId = req.user.departmentId;
    const students = await Student.find({ departmentId: deptId, isDeleted: false })
      .populate('userId', 'name email status');
    res.status(200).json(students);
  } catch (error) {
    console.error('getDeptStudents Error:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};
