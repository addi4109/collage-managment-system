import Department from '../models/Department.js';

export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.find({ isDeleted: false, status: 'active' });
    res.status(200).json(depts);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ message: 'Internal server error retrieving departments.' });
  }
};

export const createOrUpdateDepartment = async (req, res) => {
  const { id, name, code, status, years } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: 'Department Name and Code are required.' });
  }
  try {
    let dept;
    if (id) {
      dept = await Department.findOne({ _id: id, isDeleted: false });
    } else {
      dept = await Department.findOne({
        $or: [{ name }, { code }],
        isDeleted: false,
      });
    }

    if (dept) {
      dept.name = name;
      dept.code = code;
      if (years) dept.years = years;
      if (status) dept.status = status;
      await dept.save();
    } else {
      dept = new Department({
        name,
        code,
        status: status || 'active',
        years: years || [
          { name: 'First Year', semesters: ['Sem 1', 'Sem 2'] },
          { name: 'Second Year', semesters: ['Sem 3', 'Sem 4'] },
          { name: 'Third Year', semesters: ['Sem 5', 'Sem 6'] },
        ],
      });
      await dept.save();
    }
    res.status(200).json({ success: true, department: dept });
  } catch (err) {
    console.error('Save department error:', err);
    res.status(500).json({ message: 'Internal server error saving department.' });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const dept = await Department.findOne({ _id: id, isDeleted: false });
    if (!dept) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    dept.isDeleted = true;
    dept.deletedAt = new Date();
    await dept.save();
    res.status(200).json({ success: true, message: 'Department soft-deleted successfully.' });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ message: 'Internal server error deleting department.' });
  }
};
