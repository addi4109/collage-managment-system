import * as auditService from '../services/auditService.js';

export const getLogsList = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const filters = {
      action: req.query.action,
      userId: req.query.userId,
    };

    const logs = await auditService.getLogs(filters, limit, page);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve system audit logs.' });
  }
};
