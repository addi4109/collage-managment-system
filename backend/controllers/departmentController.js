import Department from '../models/Department.js';

export const verifyMasterCode = async (req, res) => {
  const { masterCode } = req.body;
  if (!masterCode) {
    return res.status(400).json({ message: 'Master access code is required.' });
  }
  const envMasterCode = process.env.FACULTY_MASTER_CODE || 'faculty123';
  if (masterCode === envMasterCode) {
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid Faculty Master Access Code.' });
  }
};

export const verifyDepartmentSecret = async (req, res) => {
  const { departmentName, secretCode } = req.body;
  if (!departmentName || !secretCode) {
    return res.status(400).json({ message: 'Department name and secret code are required.' });
  }
  try {
    const dept = await Department.findOne({ departmentName, status: 'active' });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found or inactive.' });
    }
    if (dept.departmentSecretCode === secretCode) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid Secret Code for this department.' });
    }
  } catch (err) {
    console.error('Verify department secret error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const verifySemesterSecret = async (req, res) => {
  const { departmentName, semesterNumber, secretCode } = req.body;
  if (!departmentName || !semesterNumber || !secretCode) {
    return res.status(400).json({ message: 'Department name, semester number, and secret code are required.' });
  }
  try {
    const dept = await Department.findOne({ departmentName, status: 'active' });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found or inactive.' });
    }
    const semNum = parseInt(semesterNumber, 10);
    const semester = dept.semesters.find((s) => s.semesterNumber === semNum);
    if (!semester) {
      return res.status(404).json({ success: false, message: `Semester ${semNum} not configured for this department.` });
    }
    if (semester.semesterSecretCode === secretCode) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid Semester Secret Code.' });
    }
  } catch (err) {
    console.error('Verify semester secret error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.find({ status: 'active' }).select('departmentName departmentCode subjects status');
    res.json(depts);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createOrUpdateDepartment = async (req, res) => {
  const { id, name, code, secretCode, semesters, subjects, status } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: 'Department Name and Code are required.' });
  }
  try {
    let dept;
    if (id) {
      try {
        dept = await Department.findById(id);
      } catch (e) {
        // invalid object id fallback
      }
    }
    if (!dept) {
      dept = await Department.findOne({ $or: [{ departmentName: name }, { departmentCode: code }] });
    }

    const parsedSubjects = Array.isArray(subjects) ? subjects : [];
    const parsedSemesters = Array.isArray(semesters) ? semesters : [];

    if (dept) {
      dept.departmentName = name;
      dept.departmentCode = code;
      if (secretCode) dept.departmentSecretCode = secretCode;
      dept.subjects = parsedSubjects;
      if (parsedSemesters.length > 0) dept.semesters = parsedSemesters;
      dept.status = status || dept.status;
      await dept.save();
    } else {
      if (!secretCode) {
        return res.status(400).json({ message: 'Secret Code is required for new departments.' });
      }
      dept = new Department({
        departmentName: name,
        departmentCode: code,
        departmentSecretCode: secretCode,
        semesters: parsedSemesters,
        subjects: parsedSubjects,
        status: status || 'active',
      });
      await dept.save();
    }
    res.json({ success: true, department: dept });
  } catch (err) {
    console.error('Save department error:', err);
    res.status(500).json({ message: 'Internal server error saving department.' });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    // Attempt deletion by ID or code
    let dept = await Department.findByIdAndDelete(id);
    if (!dept) {
      dept = await Department.findOneAndDelete({ departmentCode: id });
    }
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ message: 'Internal server error deleting department.' });
  }
};
