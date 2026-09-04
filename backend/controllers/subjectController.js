import Subject from '../models/Subject.js';

export const getSubjects = async (req, res) => {
  try {
    const query = { isDeleted: false };
    if (req.user.role === 'hod') {
      req.query.departmentId = req.user.departmentId;
    }
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.year) query.year = req.query.year;
    if (req.query.semester) query.semester = req.query.semester;

    const subjects = await Subject.find(query)
      .populate('departmentId', 'name code')
      .sort({ code: 1 });
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving subjects.' });
  }
};

export const createOrUpdateSubject = async (req, res) => {
  const { id, name, code, year, semester, status, maxInternal, maxPractical, maxTheory } = req.body;
  let { departmentId } = req.body;

  if (req.user.role === 'hod') {
    departmentId = req.user.departmentId;
  }

  if (!name || !code || !departmentId || !year || !semester) {
    return res.status(400).json({ message: 'Missing required subject parameters.' });
  }

  try {
    let subject;
    if (id) {
      subject = await Subject.findOne({ _id: id, isDeleted: false });
    } else {
      subject = await Subject.findOne({ code, isDeleted: false });
    }

    if (subject) {
      subject.name = name;
      subject.code = code;
      subject.departmentId = departmentId;
      subject.year = year;
      subject.semester = semester;
      if (status) subject.status = status;
      if (maxInternal !== undefined) subject.maxInternal = maxInternal;
      if (maxPractical !== undefined) subject.maxPractical = maxPractical;
      if (maxTheory !== undefined) subject.maxTheory = maxTheory;
      await subject.save();
    } else {
      subject = new Subject({
        name,
        code,
        departmentId,
        year,
        semester,
        status: status || 'active',
        maxInternal: maxInternal !== undefined ? maxInternal : 20,
        maxPractical: maxPractical !== undefined ? maxPractical : 30,
        maxTheory: maxTheory !== undefined ? maxTheory : 80,
      });
      await subject.save();
    }
    res.status(200).json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ message: 'Error saving subject.' });
  }
};

export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    const subject = await Subject.findOne({ _id: id, isDeleted: false });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    
    if (req.user.role === 'hod' && subject.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete subjects from other departments.' });
    }

    subject.isDeleted = true;
    subject.deletedAt = new Date();
    await subject.save();
    res.status(200).json({ success: true, message: 'Subject soft-deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting subject.' });
  }
};
