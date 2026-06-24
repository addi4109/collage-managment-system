import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  MenuItem,
  CircularProgress,
  Divider,
  TextField,
  Paper,
} from '@mui/material';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PrintIcon from '@mui/icons-material/Print';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import {
  CertificateDetails,
  requestCertificate,
} from '../services/erpService';

export const CertificatesAndId: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateDetails | null>(null);
  const [certType, setCertType] = useState<'bonafide' | 'leaving' | 'internship'>('bonafide');

  const handleRequestCert = async () => {
    setLoading(true);
    try {
      const res = await requestCertificate(certType);
      setCertificate(res.certificate);
      toast.success('Certificate generated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="xl" className="animate-fade-in" sx={{ mt: 3, mb: 4 }}>
      {/* Printable CSS style sheet override for clean printing */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <Box sx={{ mb: 4 }} className="no-print">
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Credentials & Documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Request official documents, letters, or print your dynamic Student ID Card.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Certificate Request Form */}
        <Grid item xs={12} md={5} className="no-print">
          <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReceiptLongIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Request Documents
                </Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              
              <TextField
                fullWidth
                select
                label="Certificate Type"
                value={certType}
                onChange={(e: any) => setCertType(e.target.value)}
                sx={{ mb: 3 }}
              >
                <MenuItem value="bonafide">Bonafide Certificate</MenuItem>
                <MenuItem value="leaving">Leaving Certificate</MenuItem>
                <MenuItem value="internship">Internship Permission Letter</MenuItem>
              </TextField>

              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={handleRequestCert}
                disabled={loading}
                sx={{ fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Document'}
              </Button>
            </CardContent>
          </Card>

          {/* ID CARD Display Preview Container */}
          <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ContactPageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Student ID Card
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {/* ID Card Graphic mockup container */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                  id="printable-area"
                  sx={{
                    width: 320,
                    height: 480,
                    p: 3,
                    borderRadius: 4,
                    border: '1.5px solid #22c55e',
                    background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* University Header decoration */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', letterSpacing: 0.8 }}>
                    ANTIGRAVITY CMS UNIVERSITY
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                    Official Smart Identity Card
                  </Typography>

                  {/* Profile Image mockup placeholder */}
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      my: 2,
                      borderRadius: '50%',
                      border: '3px solid #22c55e',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'success.main',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </Box>

                  {/* User Details */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {user?.name || 'Student Name'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    ROLL NO: {user?.rollNumber || 'N/A'}
                  </Typography>

                  <Divider sx={{ my: 1.5, opacity: 0.08 }} />

                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user?.department || 'Department of Engineering'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {user?.semester || 'Sem X'} ({user?.year || 'First Year'})
                  </Typography>

                  {/* Barcode Mockup */}
                  <Box
                    sx={{
                      width: '80%',
                      height: 35,
                      mx: 'auto',
                      mt: 3,
                      background: 'repeating-linear-gradient(90deg, #111 0px, #111 2px, #fff 2px, #fff 6px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: 'text.secondary' }}>
                    * LIBRARY SMART BARCODE *
                  </Typography>
                </Paper>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                color="success"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ mt: 3, fontWeight: 700 }}
              >
                Print Student ID Card
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificate Printable Output Panel */}
        <Grid item xs={12} md={7}>
          <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', minHeight: 400 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="no-print">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Document Preview Panel
                </Typography>
                {certificate && (
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ fontWeight: 700 }}
                  >
                    Print Document
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 3 }} className="no-print" />

              {!certificate ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300,
                    color: 'text.secondary',
                    textAlign: 'center',
                  }}
                >
                  <ReceiptLongIcon sx={{ fontSize: 64, mb: 1, opacity: 0.2 }} />
                  <Typography variant="body2">
                    No document has been generated yet. Select a document type on the left panel to begin.
                  </Typography>
                </Box>
              ) : (
                <Paper
                  id="printable-area"
                  sx={{
                    p: 5,
                    border: '2px double rgba(0,0,0,0.15)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: '#111827',
                    minHeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* College Header */}
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                      {certificate.collegeName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Accredited with Grade 'A+' by CMS National Board of Engineering
                    </Typography>
                    <Divider sx={{ mt: 2, borderColor: 'success.main', borderHeight: 1.5 }} />
                  </Box>

                  {/* Document Name */}
                  <Box sx={{ textAlign: 'center', my: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline' }}>
                      {certificate.type === 'bonafide'
                        ? 'Bonafide Certificate'
                        : certificate.type === 'leaving'
                        ? 'College Leaving Certificate'
                        : 'Internship Recommendation Letter'}
                    </Typography>
                  </Box>

                  {/* Body Paragraph */}
                  <Box sx={{ my: 3, px: 2 }}>
                    {certificate.type === 'bonafide' && (
                      <Typography variant="body1" sx={{ lineHeight: 2, textAlign: 'justify' }}>
                        This is to certify that Mr./Ms. <b>{certificate.studentName}</b>, Roll Number <b>{certificate.rollNumber}</b>, is a bonafide student of this college, currently studying in <b>{certificate.semester}</b> of the <b>{certificate.department}</b> department for the academic year 2026. To the best of our knowledge, his/her character and conduct are satisfactory.
                      </Typography>
                    )}
                    {certificate.type === 'leaving' && (
                      <Typography variant="body1" sx={{ lineHeight: 2, textAlign: 'justify' }}>
                        This is to certify that Mr./Ms. <b>{certificate.studentName}</b>, Enrollment Number <b>{certificate.enrollmentNumber}</b>, was a student of the <b>{certificate.department}</b> department. He/She has completed his/her graduation course and is leaving this institution. We wish him/her all success in his/her future endeavors.
                      </Typography>
                    )}
                    {certificate.type === 'internship' && (
                      <Typography variant="body1" sx={{ lineHeight: 2, textAlign: 'justify' }}>
                        We hereby recommend Mr./Ms. <b>{certificate.studentName}</b> of the <b>{certificate.department}</b> department, studying in semester <b>{certificate.semester}</b>, to undergo an industrial training / internship program. This institution grants permission for the student to acquire practical exposure during scheduled breaks.
                      </Typography>
                    )}
                  </Box>

                  {/* Signature and Verification Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <VerifiedUserIcon color="success" fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          DIGITALLY VERIFIED
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Verification Code: <b>{certificate.verificationCode}</b>
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Date of Issue: {certificate.dateGenerated}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1, width: 160 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Principal Seal & Signature
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CertificatesAndId;
