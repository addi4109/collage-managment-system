import * as admissionService from '../services/admissionService.js';

export const createRequest = async (req, res) => {
  try {
    const request = await admissionService.createAdmissionRequest(req.body, req.user.id);
    res.status(201).json({ message: 'Admission request submitted successfully.', request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getPending = async (req, res) => {
  try {
    const requests = await admissionService.getPendingAdmissions();
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending admission requests.' });
  }
};

export const approve = async (req, res) => {
  try {
    const student = await admissionService.approveAdmission(req.params.id, req.user.id, req.ip);
    res.status(200).json({ message: 'Admission request approved. Student user created successfully.', student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const reject = async (req, res) => {
  try {
    const request = await admissionService.rejectAdmission(req.params.id, req.user.id, req.ip);
    res.status(200).json({ message: 'Admission request rejected.', request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
