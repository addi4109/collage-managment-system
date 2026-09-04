import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HistoryIcon from '@mui/icons-material/History';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DashboardOverviewTab from '../components/DashboardOverviewTab';
import ContactSupportTab from '../components/ContactSupportTab';

export default function LibrarianDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);

  // Add Book Form
  const [openAddBook, setOpenAddBook] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', category: '', bookCode: '', totalCopies: 1,
  });

  // Edit Book
  const [openEditBook, setOpenEditBook] = useState(false);
  const [editBookForm, setEditBookForm] = useState({
    _id: '', title: '', author: '', isbn: '', category: '', bookCode: '', totalCopies: 1, finePerDay: 2,
  });

  // Issue Book
  const [openIssue, setOpenIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ bookCode: '', studentUserId: '', days: 14 });

  // Renew Book
  const [openRenew, setOpenRenew] = useState(false);
  const [renewForm, setRenewForm] = useState({ issueLogId: '', additionalDays: 14 });
  const [activeIssues, setActiveIssues] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bookRes = await api.get('/library/books');
      setBooks(bookRes.data);

      if (tab === 'issue_book' || tab === 'renew_book' || tab === 'logs') {
        const stuRes = await api.get('/students');
        setStudents(stuRes.data);
      }
      if (tab === 'logs' || tab === 'renew_book') {
        const logsRes = await api.get('/library/logs');
        setLogs(logsRes.data);
        if (tab === 'renew_book') {
          const activeLogs = logsRes.data.filter(l => l.status !== 'returned');
          setActiveIssues(activeLogs);
        }
      }
    } catch (err) {
      showToast('Error loading library records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/books', bookForm);
      showToast('Book registered successfully.', 'success');
      setOpenAddBook(false);
      setBookForm({ title: '', author: '', isbn: '', category: '', bookCode: '', totalCopies: 1 });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error registering book.', 'error');
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/library/books/${editBookForm._id}`, editBookForm);
      showToast('Book updated successfully.', 'success');
      setOpenEditBook(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating book.', 'error');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await api.delete(`/library/books/${bookId}`);
      showToast('Book deleted successfully.', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting book.', 'error');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/issue', issueForm);
      showToast('Book issued successfully.', 'success');
      setOpenIssue(false);
      setIssueForm({ bookCode: '', studentUserId: '', days: 14 });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error issuing book.', 'error');
    }
  };

  const handleRenewBook = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/library/renew/${renewForm.issueLogId}`, { additionalDays: renewForm.additionalDays });
      showToast('Book renewed successfully. Due date extended.', 'success');
      setOpenRenew(false);
      setRenewForm({ issueLogId: '', additionalDays: 14 });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error renewing book.', 'error');
    }
  };

  const handleReturnBook = async (logId) => {
    if (!window.confirm('Process book return?')) return;
    try {
      await api.put(`/library/return/${logId}`);
      showToast('Book returned successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to return book.', 'error');
    }
  };

  const openEditDialog = (book) => {
    setEditBookForm({
      _id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || '',
      bookCode: book.bookCode,
      totalCopies: book.totalCopies,
      finePerDay: book.finePerDay || 2,
    });
    setOpenEditBook(true);
  };

  const openRenewDialog = (log) => {
    setRenewForm({ issueLogId: log._id, additionalDays: 14 });
    setOpenRenew(true);
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      {/* OVERVIEW */}
      {tab === 'overview' && <DashboardOverviewTab />}

      {/* ADD BOOK */}
      {tab === 'add_book' && (
        <Box>
          <Card sx={{ p: 4, borderRadius: '24px', maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <LibraryBooksIcon color="primary" /> Register New Book
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Add a new book to the library catalog.
            </Typography>
            <form onSubmit={handleCreateBook}>
              <TextField fullWidth required label="Book Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth required label="Author Name" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} sx={{ mb: 2 }} />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField fullWidth label="ISBN" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Category" placeholder="e.g. Science, Fiction" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField fullWidth required label="Book Code" placeholder="e.g. LIB-001" value={bookForm.bookCode} onChange={(e) => setBookForm({ ...bookForm, bookCode: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth required type="number" label="Total Copies" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })} />
                </Grid>
              </Grid>
              <Button fullWidth size="large" variant="contained" type="submit" startIcon={<AddIcon />}>
                Register Book
              </Button>
            </form>
          </Card>
        </Box>
      )}

      {/* EDIT BOOK */}
      {tab === 'edit_book' && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" /> Edit Book Catalog
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Title / Author</TableCell>
                  <TableCell>Code / ISBN</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Copies</TableCell>
                  <TableCell align="right">Action</TableCell>
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
                    <TableCell><Chip label={`${b.availableCopies} / ${b.totalCopies}`} size="small" /></TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEditDialog(b)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* DELETE BOOK */}
      {tab === 'delete_book' && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" /> Delete Books
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Title / Author</TableCell>
                  <TableCell>Code / ISBN</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Copies</TableCell>
                  <TableCell align="right">Action</TableCell>
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
                    <TableCell><Chip label={`${b.availableCopies} / ${b.totalCopies}`} size="small" /></TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteBook(b._id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ISSUE BOOK */}
      {tab === 'issue_book' && (
        <Box>
          <Card sx={{ p: 4, borderRadius: '24px', maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <BookmarkAddedIcon color="primary" /> Issue Book to Student
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Issue a book from the library catalog to a student.
            </Typography>
            <form onSubmit={handleIssueBook}>
              <TextField fullWidth required label="Book Code" placeholder="e.g. LIB-001" value={issueForm.bookCode} onChange={(e) => setIssueForm({ ...issueForm, bookCode: e.target.value })} sx={{ mb: 2 }} />
              <TextField select fullWidth required label="Select Student" value={issueForm.studentUserId} onChange={(e) => setIssueForm({ ...issueForm, studentUserId: e.target.value })} sx={{ mb: 2 }}>
                {students.map((st) => (
                  <MenuItem key={st._id} value={st.userId?._id}>
                    {st.userId?.name} ({st.rollNumber})
                  </MenuItem>
                ))}
              </TextField>
              <TextField fullWidth required type="number" label="Lending Duration (Days)" value={issueForm.days} onChange={(e) => setIssueForm({ ...issueForm, days: Number(e.target.value) })} sx={{ mb: 3 }} />
              <Button fullWidth size="large" variant="contained" type="submit" startIcon={<BookmarkAddedIcon />}>
                Issue Book
              </Button>
            </form>
          </Card>
        </Box>
      )}

      {/* RENEW BOOK */}
      {tab === 'renew_book' && (
        <Box>
          <Card sx={{ p: 4, borderRadius: '24px', maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AutorenewIcon color="primary" /> Renew Book
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Extend the due date for an issued book.
            </Typography>
            <form onSubmit={handleRenewBook}>
              <TextField select fullWidth required label="Select Issued Book" value={renewForm.issueLogId} onChange={(e) => setRenewForm({ ...renewForm, issueLogId: e.target.value })} sx={{ mb: 2 }}>
                {logs.filter(l => l.status !== 'returned').map((log) => (
                  <MenuItem key={log._id} value={log._id}>
                    {log.bookId?.title} - {log.studentId?.name} (Due: {new Date(log.dueDate).toLocaleDateString()})
                  </MenuItem>
                ))}
              </TextField>
              <TextField fullWidth required type="number" label="Additional Days to Extend" value={renewForm.additionalDays} onChange={(e) => setRenewForm({ ...renewForm, additionalDays: Number(e.target.value) })} sx={{ mb: 3 }} />
              <Button fullWidth size="large" variant="contained" type="submit" startIcon={<AutorenewIcon />}>
                Renew Book
              </Button>
            </form>
          </Card>
        </Box>
      )}

      {/* LENDING LOGS */}
      {tab === 'logs' && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" /> Lending Circulation History
          </Typography>
          {logs.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'action.hover' }}>
              <Typography color="text.secondary">No lending records found.</Typography>
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
                  {logs.map((log) => (
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
                        {log.status !== 'returned' && (
                          <IconButton color="primary" onClick={() => handleReturnBook(log._id)} title="Return Book">
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
        </Box>
      )}

      {/* CONTACT */}
      {tab === 'contact' && <ContactSupportTab />}

      {/* EDIT BOOK DIALOG */}
      <Dialog open={openEditBook} onClose={() => setOpenEditBook(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditBook}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Book Details</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Book Title" fullWidth required value={editBookForm.title} onChange={(e) => setEditBookForm({ ...editBookForm, title: e.target.value })} />
            <TextField label="Author Name" fullWidth required value={editBookForm.author} onChange={(e) => setEditBookForm({ ...editBookForm, author: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="ISBN" fullWidth value={editBookForm.isbn} onChange={(e) => setEditBookForm({ ...editBookForm, isbn: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Category" fullWidth value={editBookForm.category} onChange={(e) => setEditBookForm({ ...editBookForm, category: e.target.value })} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Book Code" fullWidth required value={editBookForm.bookCode} onChange={(e) => setEditBookForm({ ...editBookForm, bookCode: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Total Copies" type="number" fullWidth required value={editBookForm.totalCopies} onChange={(e) => setEditBookForm({ ...editBookForm, totalCopies: Number(e.target.value) })} />
              </Grid>
            </Grid>
            <TextField label="Fine Per Day" type="number" fullWidth value={editBookForm.finePerDay} onChange={(e) => setEditBookForm({ ...editBookForm, finePerDay: Number(e.target.value) })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditBook(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
