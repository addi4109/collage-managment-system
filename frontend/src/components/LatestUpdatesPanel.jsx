import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Chip, Button, Divider,
  CircularProgress, Avatar, List, ListItem, ListItemAvatar, ListItemText, Tooltip,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import CampaignIcon from "@mui/icons-material/Campaign";
import QuizIcon from "@mui/icons-material/Quiz";
import QrCodeIcon from "@mui/icons-material/QrCode";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SchoolIcon from "@mui/icons-material/School";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { api } from "../context/AuthContext";

function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

async function buildAdminUpdates() {
  const updates = [];
  const [apps, admissions, exams, notices, scholarships] = await Promise.allSettled([
    api.get("/applications/pending"), api.get("/admissions/pending"),
    api.get("/exams/pending"), api.get("/notices"), api.get("/scholarships"),
  ]);
  if (apps.status === "fulfilled") {
    const list = apps.value.data || [];
    if (list.length === 0) {
      updates.push({ id: "apps-ok", icon: <CheckCircleOutlineIcon />, iconColor: "#10b981", iconBg: "#d1fae5", label: "All applications resolved", sub: "No pending requests at this time.", time: null, chipLabel: "All Clear", chipColor: "success", actionLabel: "Application Approvals", actionPath: "/dashboard/admin?tab=applications", priority: 5 });
    } else {
      list.slice(0, 3).forEach(a => updates.push({ id: "app-" + a._id, icon: <AssignmentIcon />, iconColor: "#f59e0b", iconBg: "#fef3c7", label: "New " + (a.type || "Application") + " from " + (a.applicant?.name || "a user"), sub: a.subject || a.description?.slice(0, 70) || "Requires review", time: a.createdAt, chipLabel: "Pending Review", chipColor: "warning", actionLabel: "Review in Application Approvals", actionPath: "/dashboard/admin?tab=applications", priority: 1 }));
    }
  }
  if (admissions.status === "fulfilled") (admissions.value.data || []).slice(0, 3).forEach(a => updates.push({ id: "adm-" + a._id, icon: <HowToRegIcon />, iconColor: "#6366f1", iconBg: "#e0e7ff", label: "Admission request for " + a.name, sub: (a.departmentId?.name || "") + " - " + (a.year || "") + " " + (a.semester || ""), time: a.createdAt, chipLabel: "Admission Pending", chipColor: "info", actionLabel: "Review in Admission Approvals", actionPath: "/dashboard/admin?tab=admissions", priority: 2 }));
  if (exams.status === "fulfilled") (exams.value.data || []).slice(0, 3).forEach(e => updates.push({ id: "exam-" + e._id, icon: <QuizIcon />, iconColor: "#8b5cf6", iconBg: "#ede9fe", label: 'Exam "' + e.title + '" awaiting approval', sub: (e.subjectId?.name || "Subject") + " by " + (e.facultyId?.name || "Faculty"), time: e.createdAt, chipLabel: "Exam Approval", chipColor: "secondary", actionLabel: "Review in Exam Approvals", actionPath: "/dashboard/admin?tab=exams", priority: 2 }));
  if (notices.status === "fulfilled") { const list = notices.value.data?.notices || notices.value.data || []; list.slice(0, 2).forEach(n => updates.push({ id: "notice-" + n._id, icon: <CampaignIcon />, iconColor: "#0ea5e9", iconBg: "#e0f2fe", label: n.title, sub: (n.content || "").slice(0, 80), time: n.createdAt, chipLabel: "Notice", chipColor: "info", actionLabel: "View in Notice Board", actionPath: "/dashboard/admin?tab=notices", priority: 4 })); }
  if (scholarships.status === "fulfilled") { const list = (scholarships.value.data || []).filter(s => s.status === "pending"); list.slice(0, 2).forEach(s => updates.push({ id: "sch-" + s._id, icon: <CardGiftcardIcon />, iconColor: "#f43f5e", iconBg: "#ffe4e6", label: "Scholarship from " + (s.studentId?.name || "a student"), sub: s.scholarshipName || "", time: s.createdAt, chipLabel: "Scholarship", chipColor: "error", actionLabel: "Review in Scholarship Approver", actionPath: "/dashboard/admin?tab=scholarships", priority: 3 })); }
  return updates.sort((a, b) => a.priority - b.priority);
}

async function buildFacultyUpdates() {
  const updates = [];
  const [sessions, exams, notices] = await Promise.allSettled([api.get("/session"), api.get("/exams/my"), api.get("/notices")]);
  if (sessions.status === "fulfilled") {
    const active = (sessions.value.data || []).filter(s => s.status === "active");
    if (active.length > 0) {
      active.slice(0, 2).forEach(s => updates.push({ id: "sess-" + s._id, icon: <PlayCircleOutlineIcon />, iconColor: "#10b981", iconBg: "#d1fae5", label: "Session LIVE: " + s.subjectName, sub: "Started " + timeAgo(s.startTime) + " - Students can scan QR now", time: s.startTime, chipLabel: "Active Now", chipColor: "success", actionLabel: "Manage in Mark Attendance", actionPath: "/dashboard/faculty?tab=attendance", priority: 1 }));
    } else {
      updates.push({ id: "sess-none", icon: <QrCodeIcon />, iconColor: "#6b7280", iconBg: "#f3f4f6", label: "No active attendance session", sub: "Start a session so students can scan their QR code.", time: null, chipLabel: "Idle", chipColor: "default", actionLabel: "Start in Mark Attendance", actionPath: "/dashboard/faculty?tab=attendance", priority: 4 });
    }
  }
  if (exams.status === "fulfilled") {
    const list = exams.value.data || [];
    list.filter(e => e.status === "pending_approval" || e.status === "draft").slice(0, 2).forEach(e => updates.push({ id: "exam-" + e._id, icon: <QuizIcon />, iconColor: "#f59e0b", iconBg: "#fef3c7", label: 'Exam "' + e.title + '" awaiting admin approval', sub: (e.subjectId?.name || "") + " - " + (e.totalQuestions || 0) + " questions", time: e.createdAt, chipLabel: "Awaiting Approval", chipColor: "warning", actionLabel: "View in Create MCQ Exams", actionPath: "/dashboard/faculty?tab=exams", priority: 2 }));
    list.filter(e => e.status === "scheduled").slice(0, 2).forEach(e => updates.push({ id: "exam-sch-" + e._id, icon: <ScheduleIcon />, iconColor: "#3b82f6", iconBg: "#dbeafe", label: 'Exam "' + e.title + '" is scheduled', sub: e.scheduledAt ? new Date(e.scheduledAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Date not set", time: e.scheduledAt, chipLabel: "Scheduled", chipColor: "info", actionLabel: "Manage in Create MCQ Exams", actionPath: "/dashboard/faculty?tab=exams", priority: 3 }));
  }
  if (notices.status === "fulfilled") { const list = notices.value.data?.notices || notices.value.data || []; list.slice(0, 2).forEach(n => updates.push({ id: "notice-" + n._id, icon: <CampaignIcon />, iconColor: "#0ea5e9", iconBg: "#e0f2fe", label: n.title, sub: (n.content || "").slice(0, 80), time: n.createdAt, chipLabel: "Notice", chipColor: "info", actionLabel: "View in Notice Board", actionPath: "/dashboard/faculty?tab=notices", priority: 5 })); }
  return updates.sort((a, b) => a.priority - b.priority);
}

async function buildStudentUpdates() {
  const updates = [];
  const [exams, notices, apps, fees] = await Promise.allSettled([api.get("/exams/my"), api.get("/notices"), api.get("/applications/my"), api.get("/fees/my")]);
  if (exams.status === "fulfilled") {
    const list = exams.value.data || [];
    list.filter(i => (i.exam || i).status === "active").slice(0, 2).forEach(item => { const e = item.exam || item; updates.push({ id: "exam-" + e._id, icon: <QuizIcon />, iconColor: "#ef4444", iconBg: "#fee2e2", label: 'LIVE: "' + e.title + '" is active!', sub: "Duration: " + e.durationMinutes + " min - Take it now before time runs out.", time: e.updatedAt, chipLabel: "Live Now", chipColor: "error", actionLabel: "Take in MCQ Test Client", actionPath: "/dashboard/student?tab=exams", priority: 1 }); });
    list.filter(i => (i.exam || i).status === "scheduled").slice(0, 2).forEach(item => { const e = item.exam || item; updates.push({ id: "exam-sch-" + e._id, icon: <ScheduleIcon />, iconColor: "#3b82f6", iconBg: "#dbeafe", label: 'Upcoming exam: "' + e.title + '"', sub: "Scheduled - Be prepared with " + (e.totalQuestions || "?") + " questions.", time: e.scheduledAt, chipLabel: "Upcoming", chipColor: "info", actionLabel: "View in MCQ Test Client", actionPath: "/dashboard/student?tab=exams", priority: 2 }); });
  }
  if (apps.status === "fulfilled") { const list = apps.value.data || []; list.filter(a => a.status === "pending").slice(0, 2).forEach(a => updates.push({ id: "app-" + a._id, icon: <AssignmentIcon />, iconColor: "#f59e0b", iconBg: "#fef3c7", label: 'Your "' + a.type + '" request is pending', sub: a.subject || "Awaiting admin review.", time: a.createdAt, chipLabel: "Pending", chipColor: "warning", actionLabel: "Track in Submit Request", actionPath: "/dashboard/student?tab=applications", priority: 3 })); list.filter(a => a.status === "approved").slice(0, 1).forEach(a => updates.push({ id: "app-app-" + a._id, icon: <CheckCircleOutlineIcon />, iconColor: "#10b981", iconBg: "#d1fae5", label: 'Your "' + a.type + '" was approved!', sub: a.remarks || "Approved by admin.", time: a.updatedAt, chipLabel: "Approved", chipColor: "success", actionLabel: "View in Submit Request", actionPath: "/dashboard/student?tab=applications", priority: 2 })); }
  if (fees.status === "fulfilled") { const list = fees.value.data || []; const due = list.filter(f => (f.feeDetails?.remainingAmount || 0) > 0); if (due.length > 0) { const total = due.reduce((s, f) => s + (f.feeDetails?.remainingAmount || 0), 0); updates.push({ id: "fee-due", icon: <SchoolIcon />, iconColor: "#f43f5e", iconBg: "#ffe4e6", label: "Fee due: Rs." + total.toLocaleString("en-IN"), sub: due.length + " fee structure(s) have pending balance. Pay before the deadline.", time: null, chipLabel: "Fee Due", chipColor: "error", actionLabel: "Pay in Fees and Receipts", actionPath: "/dashboard/student?tab=fees", priority: 2 }); } }
  if (notices.status === "fulfilled") { const list = notices.value.data?.notices || notices.value.data || []; list.slice(0, 3).forEach(n => updates.push({ id: "notice-" + n._id, icon: <CampaignIcon />, iconColor: "#0ea5e9", iconBg: "#e0f2fe", label: n.title, sub: (n.content || "").slice(0, 80), time: n.createdAt, chipLabel: "Notice", chipColor: "info", actionLabel: "Read in Notice Board", actionPath: "/dashboard/student?tab=notices", priority: 4 })); }
  return updates.sort((a, b) => a.priority - b.priority);
}

export default function LatestUpdatesPanel({ role }) {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetch = role === "admin" ? buildAdminUpdates() : role === "faculty" ? buildFacultyUpdates() : buildStudentUpdates();
    fetch.then(data => { if (!cancelled) { setUpdates(data); setLoading(false); } }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [role]);

  return (
    <Card sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", overflow: "hidden", mt: 4 }}>
      <Box sx={{ px: 3, py: 2.5, background: "linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)", display: "flex", alignItems: "center", gap: 1.5 }}>
        <NotificationsActiveIcon sx={{ color: "#fff", fontSize: 26 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff", lineHeight: 1.2 }}>Latest Updates</Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>Real-time activity feed - auto-refreshes on page load</Typography>
        </Box>
        {!loading && (
          <Chip label={updates.length + " item" + (updates.length !== 1 ? "s" : "")} size="small" sx={{ ml: "auto", bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.3)" }} />
        )}
      </Box>
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6, gap: 2 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Fetching latest activity...</Typography>
          </Box>
        ) : updates.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
            <Typography variant="h6" color="text.secondary">Everything is up to date!</Typography>
            <Typography variant="body2" color="text.disabled">No new updates at this time.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {updates.map((item, idx) => (
              <React.Fragment key={item.id}>
                <ListItem alignItems="flex-start" sx={{ py: 2, px: 3, "&:hover": { bgcolor: "action.hover" } }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: item.iconBg, color: item.iconColor, width: 44, height: 44, mr: 1 }}>{item.icon}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.3 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{item.label}</Typography>
                        <Chip label={item.chipLabel} color={item.chipColor} size="small" sx={{ fontWeight: "bold", fontSize: "0.68rem", height: 20 }} />
                        {item.time && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <FiberManualRecordIcon sx={{ fontSize: 6 }} />{timeAgo(item.time)}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.4 }}>{item.sub}</Typography>
                        <Tooltip title={"Go to: " + item.actionPath} placement="bottom-start">
                          <Button size="small" variant="outlined" endIcon={<ArrowForwardIcon fontSize="small" />}
                            onClick={() => navigate(item.actionPath)}
                            sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.75rem", py: 0.4, borderColor: item.iconColor, color: item.iconColor, "&:hover": { bgcolor: item.iconBg } }}>
                            {item.actionLabel}
                          </Button>
                        </Tooltip>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < updates.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
