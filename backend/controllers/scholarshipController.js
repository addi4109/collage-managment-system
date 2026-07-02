import * as scholarshipService from '../services/scholarshipService.js';

export const apply = async (req, res) => {
  try {
    const app = await scholarshipService.applyScholarship(req.body, req.user.id);
    res.status(201).json(app);
  } catch (error) {
    console.error('Apply scholarship error:', error);
    res.status(500).json({ message: error.message || 'Internal server error applying for scholarship.' });
  }
};

export const list = async (req, res) => {
  try {
    const apps = await scholarshipService.getScholarships(req.user);
    res.json(apps);
  } catch (error) {
    console.error('List scholarships error:', error);
    res.status(500).json({ message: error.message || 'Internal server error listing scholarships.' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { scholarshipId } = req.params;
    const app = await scholarshipService.updateScholarshipStatus(scholarshipId, req.body, req.user.id);
    res.json(app);
  } catch (error) {
    console.error('Update scholarship status error:', error);
    res.status(500).json({ message: error.message || 'Internal server error updating scholarship status.' });
  }
};
