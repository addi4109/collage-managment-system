import * as placementService from '../services/placementService.js';

export const createDrive = async (req, res) => {
  try {
    const drive = await placementService.createPlacementDrive(req.body, req.user.id);
    res.status(201).json(drive);
  } catch (error) {
    console.error('Create placement drive error:', error);
    res.status(500).json({ message: error.message || 'Internal server error creating drive.' });
  }
};

export const listDrives = async (req, res) => {
  try {
    const drives = await placementService.getPlacementDrives(req.user);
    res.json(drives);
  } catch (error) {
    console.error('Fetch placement drives error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching drives.' });
  }
};

export const publishDrive = async (req, res) => {
  try {
    const { driveId } = req.params;
    const drive = await placementService.publishDriveToDepartment(driveId, req.user);
    res.json(drive);
  } catch (error) {
    console.error('Publish drive error:', error);
    res.status(500).json({ message: error.message || 'Internal server error publishing drive.' });
  }
};

export const applyDrive = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { cgpa } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required.' });
    }

    const resumeUrl = `/uploads/${req.file.filename}`;
    const resumeFileName = req.file.originalname;

    const application = await placementService.applyToPlacementDrive(
      driveId,
      req.user.id,
      resumeUrl,
      resumeFileName,
      Number(cgpa)
    );
    res.status(201).json(application);
  } catch (error) {
    console.error('Apply to placement drive error:', error);
    res.status(500).json({ message: error.message || 'Internal server error applying to drive.' });
  }
};

export const listApplications = async (req, res) => {
  try {
    const { driveId } = req.params;
    const applications = await placementService.getDriveApplications(driveId, req.user);
    res.json(applications);
  } catch (error) {
    console.error('Fetch drive applications error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching applications.' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await placementService.updateApplicationStatus(
      applicationId,
      req.body,
      req.user.id,
      req.user.role,
      req.user.departmentId
    );
    res.json(application);
  } catch (error) {
    console.error('Update placement application status error:', error);
    res.status(500).json({ message: error.message || 'Internal server error updating application.' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const stats = await placementService.getPlacementAnalytics();
    res.json(stats);
  } catch (error) {
    console.error('Fetch placement stats error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching stats.' });
  }
};

export const removeDrive = async (req, res) => {
  try {
    const { driveId } = req.params;
    await placementService.deletePlacementDrive(driveId, req.user.id, req.user.role);
    res.json({ message: 'Placement drive deleted successfully.' });
  } catch (error) {
    console.error('Delete placement drive error:', error);
    res.status(500).json({ message: error.message || 'Internal server error deleting drive.' });
  }
};
