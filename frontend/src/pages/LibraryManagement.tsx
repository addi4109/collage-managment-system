import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import {
  Book,
  addBook,
  getBooks,
  issueBook,
  returnBook,
} from '../services/erpService';

export const LibraryManagement: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Dialog toggles
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form states
  const [newBookData, setNewBookData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
  });

  const [issueData, setIssueData] = useState({
    rollNumber: '',
    days: 14,
  });

  const loadBooks = async (query = '') => {
    setLoading(true);
    try {
      const data = await getBooks(query);
      setBooks(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load library books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks(search);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBook(newBookData);
      toast.success('Book added to library successfully!');
      setOpenAddDialog(false);
      setNewBookData({ title: '', author: '', isbn: '', category: '' });
      loadBooks(search);
    } catch (err: any) {
      toast.error(err.message || 'Error adding book.');
    }
  };

  const handleOpenIssue = (book: Book) => {
    setSelectedBook(book);
    setIssueData({ rollNumber: '', days: 14 });
    setOpenIssueDialog(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      const res = await issueBook(selectedBook._id, issueData.rollNumber, issueData.days);
      toast.success(res.message || 'Book issued successfully!');
      setOpenIssueDialog(false);
      loadBooks(search);
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue book.');
    }
  };

  const handleReturn = async (book: Book) => {
    if (!window.confirm(`Are you sure student returned the book: "${book.title}"?`)) return;
    try {
      const res = await returnBook(book._id);
      toast.success(res.message || 'Book returned successfully.');
      loadBooks(search);
    } catch (err: any) {
      toast.error(err.message || 'Failed to record return.');
    }
  };

  const getStatusChip = (status: string, book: Book) => {
    if (status === 'issued') {
      const isMine = book.issuedTo === user?.uid;
      return (
        <Chip
          label={isMine ? 'Issued to You' : 'Issued'}
          color={isMine ? 'warning' : 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    return <Chip label="Available" color="success" size="small" sx={{ fontWeight: 600 }} />;
  };

  return (
    <Container maxWidth="xl" className="animate-fade-in" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Library Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search library catalog, check availability, and track issue dues.
          </Typography>
        </Box>

        {user?.role === 'admin' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Add Catalog Book
          </Button>
        )}
      </Box>

      {/* Search form */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by Title, Author, Category or ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" sx={{ px: 4, fontWeight: 700 }}>
          Search
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Book Title</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Author</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>ISBN</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Issued To</TableCell>
                        {user?.role === 'admin' && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {books.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={user?.role === 'admin' ? 8 : 7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                            No books match search query.
                          </TableCell>
                        </TableRow>
                      ) : (
                        books.map((book) => (
                          <TableRow key={book._id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{book.title}</TableCell>
                            <TableCell>{book.author}</TableCell>
                            <TableCell color="text.secondary">{book.isbn || 'N/A'}</TableCell>
                            <TableCell>{book.category || 'General'}</TableCell>
                            <TableCell>{getStatusChip(book.status, book)}</TableCell>
                            <TableCell>
                              {book.dueDate ? new Date(book.dueDate).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              {book.issuedStudentName ? (
                                <Typography variant="body2">
                                  {book.issuedStudentName} ({book.issuedRollNumber})
                                </Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            {user?.role === 'admin' && (
                              <TableCell align="right">
                                {book.status === 'available' ? (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    startIcon={<BookmarkAddedIcon />}
                                    onClick={() => handleOpenIssue(book)}
                                    sx={{ fontWeight: 700 }}
                                  >
                                    Issue
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<AssignmentReturnIcon />}
                                    onClick={() => handleReturn(book)}
                                    sx={{ fontWeight: 700 }}
                                  >
                                    Return
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Admin: Add Book Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Book Catalog</DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Title"
                  value={newBookData.title}
                  onChange={(e) => setNewBookData((p) => ({ ...p, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Author"
                  value={newBookData.author}
                  onChange={(e) => setNewBookData((p) => ({ ...p, author: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ISBN Number"
                  value={newBookData.isbn}
                  onChange={(e) => setNewBookData((p) => ({ ...p, isbn: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category"
                  value={newBookData.category}
                  onChange={(e) => setNewBookData((p) => ({ ...p, category: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" sx={{ fontWeight: 700 }}>
              Add Book
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Admin: Issue Book Dialog */}
      <Dialog open={openIssueDialog} onClose={() => setOpenIssueDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Issue Book: {selectedBook?.title}</DialogTitle>
        <form onSubmit={handleIssueSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Student Roll Number"
                  value={issueData.rollNumber}
                  onChange={(e) => setIssueData((p) => ({ ...p, rollNumber: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Issue Duration (days)"
                  value={issueData.days}
                  onChange={(e) => setIssueData((p) => ({ ...p, days: parseInt(e.target.value) || 14 }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenIssueDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              Issue Book
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default LibraryManagement;
