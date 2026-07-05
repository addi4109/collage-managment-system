import * as applicationService from '../services/applicationService.js';

export const submitApplication = async (req, res) => {
  try {
    const attachments = [];
    if (req.files) {
      req.files.forEach((f) => {
        attachments.push({ filename: f.originalname, fileUrl: `/uploads/${f.filename}` });
      });
    } else if (req.file) {
      attachments.push({ filename: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
    }

    const appData = {
      ...req.body,
      attachments,
    };

    const application = await applicationService.createApplication(appData, req.user);
    res.status(201).json({ message: 'Application submitted successfully.', application });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const listMyApplications = async (req, res) => {
  try {
    const apps = await applicationService.getMyApplications(req.user.id);
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve applications.' });
  }
};

export const listPending = async (req, res) => {
  try {
    const departmentId = req.user.role === 'hod' ? req.user.departmentId : null;
    const apps = await applicationService.getPendingApplications(departmentId, req.user.role);
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve pending applications.' });
  }
};

export const review = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid review status is required.' });
    }
    const app = await applicationService.reviewApplication(req.params.id, status, remarks, req.user.id, req.ip, req.user.role);
    res.status(200).json({ message: `Application ${status} successfully.`, application: app });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
