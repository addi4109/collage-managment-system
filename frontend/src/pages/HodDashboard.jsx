import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import { useAuth } from '../context/AuthContext';
import SubjectManagementTab from '../components/SubjectManagementTab';
import FacultyDirectoryTab from '../components/FacultyDirectoryTab';
import StudentDirectoryTab from '../components/StudentDirectoryTab';
import ApplicationApprovalsTab from '../components/ApplicationApprovalsTab';
import ExamApprovalsTab from '../components/ExamApprovalsTab';
import ResultApprovalsTab from '../components/ResultApprovalsTab';
import PlacementTab from '../components/PlacementTab';
import NoticeTab from '../components/NoticeTab';
import TimetableTab from '../components/TimetableTab';
import NotificationTab from '../components/NotificationTab';
import ContactSupportTab from '../components/ContactSupportTab';
import StudentApplicationsTab from '../components/StudentApplicationsTab';
import AcademicCalendarTab from '../components/AcademicCalendarTab';

export default function HodDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';
  const { user } = useAuth();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>HOD Dashboard</Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Head of Department portal for {user.departmentName || 'your department'}.
        </Typography>
      </Box>

      {/* STATS VIEW */}
      {tab === 'stats' && (
        <Box>
          <Typography variant="h6">Overview (Coming Soon)</Typography>
          <Typography variant="body2" color="text.secondary">
            Use the sidebar to navigate to Subjects Directory or other modules.
          </Typography>
        </Box>
      )}

      {/* DIRECTORIES */}
      {tab === 'faculty' && <FacultyDirectoryTab role="hod" />}
      {tab === 'students' && <StudentDirectoryTab role="hod" />}
      {tab === 'subjects' && <SubjectManagementTab role="hod" userDepartmentId={user.departmentId} />}

      {/* APPLICATIONS */}
      {tab === 'my_applications' && (
        <StudentApplicationsTab />
      )}

      {/* APPLICATION APPROVALS */}
      {tab === 'applications' && <ApplicationApprovalsTab role="hod" />}
      {tab === 'exams' && <ExamApprovalsTab role="hod" />}
      {tab === 'results' && <ResultApprovalsTab role="hod" />}

      {/* DEPARTMENT & ERP MODULES */}
      { tab === 'notices' && <NoticeTab role="hod" /> }
      { tab === 'calendar' && <AcademicCalendarTab role="hod" /> }
      { tab === 'placements' && <PlacementTab role="hod" /> }
      { tab === 'timetable' && <TimetableTab role="hod" /> }
      { tab === 'lostfound' && <LostFoundTab role="hod" /> }
      {tab === 'contact' && <ContactSupportTab role="hod" />}
    </Box>
  );
}
