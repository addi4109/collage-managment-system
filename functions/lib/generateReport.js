"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const pdfkit_1 = __importDefault(require("pdfkit"));
exports.generateReport = functions.https.onRequest(async (req, res) => {
    // CORS Configuration
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const studentId = req.query.studentId || req.body.studentId;
    if (!studentId) {
        res.status(400).send({ error: 'Missing studentId parameter.' });
        return;
    }
    try {
        const db = admin.firestore();
        // 1. Fetch Student Profile
        const studentDoc = await db.collection('users').doc(studentId).get();
        if (!studentDoc.exists) {
            res.status(404).send({ error: 'Student profile not found.' });
            return;
        }
        const studentData = studentDoc.data() || {};
        // 2. Fetch Enrolled Courses
        const enrolled = studentData.enrolledCourses || [];
        let courses = [];
        if (enrolled.length > 0) {
            const coursesSnap = await db
                .collection('courses')
                .where(admin.firestore.FieldPath.documentId(), 'in', enrolled)
                .get();
            courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        // 3. Fetch Student Submissions & Grades
        const submissionsSnap = await db
            .collection('submissions')
            .where('studentId', '==', studentId)
            .get();
        const submissions = submissionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // 4. Fetch Attendance Records for enrolled courses
        let attendanceSessions = [];
        if (enrolled.length > 0) {
            const attendanceSnap = await db
                .collection('attendance')
                .where('courseId', 'in', enrolled)
                .get();
            attendanceSessions = attendanceSnap.docs.map((d) => d.data());
        }
        // 5. Initialize PDF Document
        const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        // Styling & Layout
        // Primary Purple: #6366f1, Dark Neutral: #111827, Light border: #e5e7eb
        const primaryColor = '#6366f1';
        const darkNeutral = '#111827';
        const textGray = '#4b5563';
        // PDF Header
        doc.fontSize(26).font('Helvetica-Bold').fillColor(primaryColor).text('EduTech Hub', { align: 'left' });
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textGray).text('ACADEMIC PROGRESS REPORT', { align: 'left' });
        doc.moveDown(1.5);
        // Decorative line
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(2).stroke();
        doc.moveDown(1.5);
        // Student Info Block
        doc.fontSize(12).font('Helvetica-Bold').fillColor(darkNeutral).text('Student Details');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textGray).text('Name: ', { continued: true }).font('Helvetica').text(studentData.name || 'N/A');
        doc.font('Helvetica-Bold').text('Email: ', { continued: true }).font('Helvetica').text(studentData.email || 'N/A');
        doc.font('Helvetica-Bold').text('Department: ', { continued: true }).font('Helvetica').text(studentData.department || 'General');
        doc.moveDown(2);
        // Courses & Attendance Table
        doc.fontSize(12).font('Helvetica-Bold').fillColor(darkNeutral).text('Subject Attendance Summary');
        doc.moveDown(0.8);
        // Header row
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text('Course Code', 50, tableTop, { width: 90 });
        doc.text('Course Name', 140, tableTop, { width: 220 });
        doc.text('Sessions Present', 360, tableTop, { width: 100, align: 'center' });
        doc.text('Percentage', 470, tableTop, { width: 75, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.moveDown(0.5);
        courses.forEach((course) => {
            const courseSessions = attendanceSessions.filter((s) => s.courseId === course.id);
            const totalSessions = courseSessions.length;
            const presentSessions = courseSessions.filter((s) => s.studentsPresent?.includes(studentId)).length;
            const percentage = totalSessions ? Math.round((presentSessions / totalSessions) * 100) : 100;
            const rowY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold').fillColor(darkNeutral).text(course.code, 50, rowY, { width: 90 });
            doc.font('Helvetica').fillColor(textGray).text(course.name, 140, rowY, { width: 220 });
            doc.text(`${presentSessions} / ${totalSessions}`, 360, rowY, { width: 100, align: 'center' });
            doc.font('Helvetica-Bold').fillColor(percentage >= 75 ? '#10b981' : '#ef4444').text(`${percentage}%`, 470, rowY, { width: 75, align: 'right' });
            doc.moveDown(0.8);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#f3f4f6').lineWidth(1).stroke();
            doc.moveDown(0.5);
        });
        doc.moveDown(1.5);
        // Assignments Grades List
        doc.fontSize(12).font('Helvetica-Bold').fillColor(darkNeutral).text('Assignments & Homework Scores');
        doc.moveDown(0.8);
        if (submissions.length === 0) {
            doc.fontSize(10).font('Helvetica-Oblique').fillColor(textGray).text('No graded assignments found for this student.');
        }
        else {
            // Loop over submissions to display scores
            for (const sub of submissions) {
                // Fetch assignment details
                const asgDoc = await db.collection('assignments').doc(sub.assignmentId).get();
                const asgData = asgDoc.data() || {};
                const rowY = doc.y;
                doc.fontSize(10).font('Helvetica-Bold').fillColor(darkNeutral).text(asgData.title || 'Assignment Task', 50, rowY, { width: 260 });
                doc.fontSize(10).font('Helvetica').fillColor(textGray).text(`Grade: `, { continued: true }).font('Helvetica-Bold').fillColor(primaryColor).text(sub.grade || 'Pending Grade');
                doc.moveDown(0.5);
                doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text(`Submitted on: ${new Date(sub.submittedAt).toLocaleDateString()}`);
                doc.moveDown(0.8);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#f3f4f6').lineWidth(1).stroke();
                doc.moveDown(0.5);
            }
        }
        // Report Footer
        doc.moveDown(3);
        doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text('Generated automatically by EduTech Hub. Official document credentials can be verified online.', { align: 'center' });
        doc.end();
        doc.on('end', async () => {
            try {
                const pdfBuffer = Buffer.concat(chunks);
                const bucket = admin.storage().bucket();
                const filename = `reports/${studentId}_progress_report.pdf`;
                const fileRef = bucket.file(filename);
                // Upload Buffer to Storage
                await fileRef.save(pdfBuffer, {
                    metadata: {
                        contentType: 'application/pdf',
                        cacheControl: 'public, max-age=31536000',
                    },
                });
                // Generate public download URL
                const [downloadUrl] = await fileRef.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2499', // permanent signed link
                });
                res.status(200).send({ success: true, downloadUrl });
            }
            catch (err) {
                functions.logger.error('Error saving PDF to bucket:', err);
                res.status(500).send({ error: 'Failed to upload PDF report to Firebase Storage.' });
            }
        });
    }
    catch (err) {
        functions.logger.error('Error compiling PDF Report:', err);
        res.status(500).send({ error: err.message || 'Internal compilation error.' });
    }
});
//# sourceMappingURL=generateReport.js.map