import * as libraryService from '../services/libraryService.js';

export const createBook = async (req, res) => {
  try {
    const book = await libraryService.addBook(req.body, req.user.id);
    res.status(201).json(book);
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ message: error.message || 'Internal server error adding book.' });
  }
};

export const listBooks = async (req, res) => {
  try {
    const books = await libraryService.getBooks();
    res.json(books);
  } catch (error) {
    console.error('List books error:', error);
    res.status(500).json({ message: error.message || 'Internal server error listing books.' });
  }
};

export const issue = async (req, res) => {
  try {
    const { bookCode, studentUserId, days } = req.body;
    if (!bookCode || !studentUserId) {
      return res.status(400).json({ message: 'bookCode and studentUserId are required.' });
    }
    const log = await libraryService.issueBook(bookCode, studentUserId, days || 14, req.user.id);
    res.status(201).json(log);
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ message: error.message || 'Internal server error issuing book.' });
  }
};

export const returnBk = async (req, res) => {
  try {
    const { issueLogId } = req.params;
    const log = await libraryService.returnBook(issueLogId, req.user.id);
    res.json(log);
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ message: error.message || 'Internal server error returning book.' });
  }
};

export const getStudentLends = async (req, res) => {
  try {
    const logs = await libraryService.getStudentIssues(req.user.id);
    res.json(logs);
  } catch (error) {
    console.error('Fetch student lends error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching lends.' });
  }
};

export const getLendLogs = async (req, res) => {
  try {
    const logs = await libraryService.getAllIssueLogs();
    res.json(logs);
  } catch (error) {
    console.error('Fetch library lends error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching lend logs.' });
  }
};
