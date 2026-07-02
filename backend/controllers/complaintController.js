import * as complaintService from '../services/complaintService.js';

export const createComplaint = async (req, res) => {
  try {
    const attachments = [];
    if (req.files) {
      req.files.forEach((f) => {
        attachments.push({ filename: f.originalname, fileUrl: `/uploads/${f.filename}` });
      });
    } else if (req.file) {
      attachments.push({ filename: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
    }

    const complaintData = {
      ...req.body,
      attachments,
    };

    const complaint = await complaintService.fileComplaint(complaintData, req.user.id);
    res.status(201).json(complaint);
  } catch (error) {
    console.error('File complaint error:', error);
    res.status(500).json({ message: error.message || 'Internal server error filing complaint.' });
  }
};

export const listComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getComplaints(req.user);
    res.json(complaints);
  } catch (error) {
    console.error('Fetch complaints error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching complaints.' });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await complaintService.resolveComplaint(complaintId, req.body, req.user.id);
    res.json(complaint);
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ message: error.message || 'Internal server error updating complaint.' });
  }
};
