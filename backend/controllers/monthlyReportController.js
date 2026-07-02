import * as monthlyReportService from '../services/monthlyReportService.js';

export const createOrUpdateReport = async (req, res) => {
  try {
    const report = await monthlyReportService.createOrUpdateReport(req.body, req.user.id);
    res.status(201).json(report);
  } catch (error) {
    console.error('Save monthly report error:', error);
    res.status(500).json({ message: error.message || 'Internal server error saving report.' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { studentId, month } = req.query;
    const reports = await monthlyReportService.getReports(req.user, studentId, month);
    res.json(reports);
  } catch (error) {
    console.error('Fetch monthly reports error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching reports.' });
  }
};

export const signReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { remarks } = req.body;
    const report = await monthlyReportService.parentSignReport(reportId, remarks, req.user.id);
    res.json(report);
  } catch (error) {
    console.error('Sign monthly report error:', error);
    res.status(500).json({ message: error.message || 'Internal server error signing report.' });
  }
};

export const publishReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await monthlyReportService.publishReport(reportId, req.user.id, req.user.role);
    res.json(report);
  } catch (error) {
    console.error('Publish monthly report error:', error);
    res.status(500).json({ message: error.message || 'Internal server error publishing report.' });
  }
};
