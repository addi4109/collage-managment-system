import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LibraryTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);

  // Student active issues
  const [issues, setIssues] = useState([]);

  // Admin logs & configurations
  const [adminLogs, setAdminLogs] = useState([]);
  const [openBook, setOpenBook] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    bookCode: '',
    totalCopies: 1,
  });

  const [openIssue, setOpenIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({
    bookCode: '',
    studentUserId: '',
    days: 14,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const bookRes = await api.get('/library/books');
      setBooks(bookRes.data);

      if (role === 'student') {
        const issuesRes = await api.get('/library/my-issues');
        setIssues(issuesRes.data);
      } else {
        const logsRes = await api.get('/library/logs');
        setAdminLogs(logsRes.data);
        const stuRes = await api.get('/students'); // get students dropdown
        setStudents(stuRes.data);
      }
    } catch (err) {
      showToast('Error loading library records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/books', bookForm);
      showToast('Book registered in catalog successfully.', 'success');
      setOpenBook(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error registering book.', 'error');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/issue', issueForm);
      showToast('Book issued successfully.', 'success');
      setOpenIssue(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error issuing book.', 'error');
    }
  };

  const handleReturnBook = async (logId) => {
    if (!window.confirm('Process book return?')) return;
    try {
      await api.put(`/library/return/${logId}`);
      showToast('Book return processed. Checked back into catalog.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to return book.', 'error');
    }
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LibraryBooksIcon color="primary" /> Library Circulation Panel
        </Typography>
        {role === 'admin' && (
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenBook(true)}>
              Register Book
            </Button>
            <Button variant="contained" startIcon={<BookmarkAddedIcon />} onClick={() => setOpenIssue(true)}>
              Issue Book
            </Button>
          </Stack>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: Books Catalog */}
        <Grid item xs={12} md={role === 'student' ? 7 : 6}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Library Catalog Grid
          </Typography>
          {books.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
              <Typography color="text.secondary">No books registered in the catalog.</Typography>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Title / Author</TableCell>
                    <TableCell>Code / ISBN</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Available</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {books.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{b.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.author}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{b.bookCode}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.isbn || 'No ISBN'}</Typography>
                      </TableCell>
                      <TableCell>{b.category || 'General'}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${b.availableCopies} / ${b.totalCopies}`}
                          color={b.availableCopies > 0 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>

        {/* Right Side: Loan Details */}
        <Grid item xs={12} md={role === 'student' ? 5 : 6}>
          {role === 'student' ? (
            <>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                My Borrowed Books
              </Typography>
              {issues.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'action.hover' }}>
                  <Typography color="text.secondary">You currently have no borrowed books.</Typography>
                </Card>
              ) : (
                <Stack spacing={2}>
                  {issues.map((iss) => (
                    <Card key={iss._id} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{iss.bookId?.title}</Typography>
                        <Chip
                          label={iss.status}
                          color={iss.status === 'overdue' ? 'error' : iss.status === 'returned' ? 'success' : 'primary'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Due Date: {new Date(iss.dueDate).toLocaleDateString()}
                      </Typography>
                      {iss.fineAmount > 0 && (
                        <Typography variant="caption" display="block" color="error.main" sx={{ fontWeight: 'bold' }}>
                          Outstanding Overdue Fine: ${iss.fineAmount}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Stack>
              )}
            </>
          ) : (
            /* ADMIN VIEW LENDING LOGS */
            <>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Lending Circulation History
              </Typography>
              {adminLogs.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'action.hover' }}>
                  <Typography color="text.secondary">No books issued yet.</Typography>
                </Card>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>Book / Student</TableCell>
                        <TableCell>Dates</TableCell>
                        <TableCell>Fine</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{log.bookId?.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Student: {log.studentId?.name} ({log.studentProfile?.rollNumber})
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">Issued: {new Date(log.issuedDate).toLocaleDateString()}</Typography>
                            <Typography variant="caption" display="block">Due: {new Date(log.dueDate).toLocaleDateString()}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: log.fineAmount > 0 ? 'error.main' : 'inherit' }}>
                            ${log.fineAmount}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.status}
                              color={log.status === 'returned' ? 'success' : log.status === 'overdue' ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {role === 'admin' && log.status !== 'returned' && (
                              <IconButton color="primary" onClick={() => handleReturnBook(log._id)}>
                                <AssignmentReturnIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* REGISTER BOOK DIALOG */}
      <Dialog open={openBook} onClose={() => setOpenBook(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateBook}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Register Book in Catalog</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Book Title"
              fullWidth
              required
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            />
            <TextField
              label="Author Name"
              fullWidth
              required
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="ISBN Number"
                  fullWidth
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Category Classification"
                  fullWidth
                  value={bookForm.category}
                  placeholder="e.g. Science, Fiction, Reference"
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Unique Book Code"
                  fullWidth
                  required
                  placeholder="e.g. LIB-0021"
                  value={bookForm.bookCode}
                  onChange={(e) => setBookForm({ ...bookForm, bookCode: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Total Stock Copies"
                  type="number"
                  fullWidth
                  required
                  value={bookForm.totalCopies}
                  onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBook(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Register</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ISSUE BOOK DIALOG */}
      <Dialog open={openIssue} onClose={() => setOpenIssue(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleIssueBook}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Issue Library Book</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Unique Book Code"
              fullWidth
              required
              placeholder="e.g. LIB-0021"
              value={issueForm.bookCode}
              onChange={(e) => setIssueForm({ ...issueForm, bookCode: e.target.value })}
            />
            <TextField
              select
              label="Select Student User"
              fullWidth
              required
              value={issueForm.studentUserId}
              onChange={(e) => setIssueForm({ ...issueForm, studentUserId: e.target.value })}
            >
              {students.map((st) => (
                <MenuItem key={st._id} value={st.userId?._id}>
                  {st.userId?.name} ({st.rollNumber})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Lending Validity Duration (in Days)"
              type="number"
              fullWidth
              required
              value={issueForm.days}
              onChange={(e) => setIssueForm({ ...issueForm, days: Number(e.target.value) })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenIssue(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Issue Book</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
