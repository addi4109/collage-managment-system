import Notice from '../models/Notice.js';
import NoticeRead from '../models/NoticeRead.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { logActivity } from './activityLogService.js';

export const createNotice = async (noticeData, creatorId, requestUser) => {
  const {
    title,
    content,
    category,
    priority,
    attachments,
    publishAt,
    expiryDate,
    pinned,
    departmentId,
    year,
    semester,
  } = noticeData;

  // Validate Faculty scope
  if (requestUser.role === 'faculty') {
    const facultyProfile = await Faculty.findOne({ userId: creatorId, isDeleted: false });
    if (!facultyProfile) {
      throw new Error('Faculty profile not found.');
    }
    // If targeted to a specific department, verify faculty is assigned
    if (departmentId && !facultyProfile.assignedDepartments.map(d => d.toString()).includes(departmentId.toString())) {
      throw new Error('Forbidden: You can only target notices to your assigned departments.');
    }
    if (year && year !== 'All' && !facultyProfile.assignedYears.includes(year)) {
      throw new Error('Forbidden: You can only target notices to your assigned years.');
    }
  }

  const notice = new Notice({
    title,
    content,
    category: category || 'General',
    priority: priority || 'Medium',
    attachments: attachments || [],
    publishAt: publishAt ? new Date(publishAt) : new Date(),
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    pinned: pinned !== undefined ? pinned : false,
    departmentId: departmentId || null,
    year: year || 'All',
    semester: semester || 'All',
    createdBy: creatorId,
  });

  await notice.save();
  await logActivity(creatorId, 'CREATE_NOTICE', 'Notice', `Created notice: ${title}`);
  return notice;
};

export const getNotices = async (filters = {}, requestUser) => {
  const query = { isDeleted: false };
  const now = new Date();

  // If student/faculty/admin, filter based on scheduling (publishAt <= now)
  // unless they are the creator or an admin.
  // We'll apply this scheduling restriction by default unless requestUser is admin
  if (requestUser.role !== 'admin') {
    query.$or = [
      { publishAt: { $lte: now } },
      { createdBy: requestUser.id } // Creators can see their drafts/scheduled notices
    ];
  }

  // Active notices only (not expired)
  if (requestUser.role !== 'admin') {
    query.$and = [
      {
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: now } }
        ]
      }
    ];
  }

  // Apply Role Scope
  if (requestUser.role === 'student') {
    const student = await Student.findOne({ userId: requestUser.id, isDeleted: false });
    if (student) {
      query.$and = query.$and || [];
      query.$and.push({
        $and: [
          {
            $or: [
              { departmentId: null },
              { departmentId: student.departmentId }
            ]
          },
          {
            $or: [
              { year: 'All' },
              { year: student.year }
            ]
          },
          {
            $or: [
              { semester: 'All' },
              { semester: student.semester }
            ]
          }
        ]
      });
    }
  } else if (requestUser.role === 'faculty') {
    const faculty = await Faculty.findOne({ userId: requestUser.id, isDeleted: false });
    if (faculty) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { createdBy: requestUser.id },
          {
            $and: [
              {
                $or: [
                  { departmentId: null },
                  { departmentId: { $in: faculty.assignedDepartments } }
                ]
              },
              {
                $or: [
                  { year: 'All' },
                  { year: { $in: faculty.assignedYears } }
                ]
              }
            ]
          }
        ]
      });
    }
  } else if (requestUser.role === 'hod') {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { createdBy: requestUser.id },
        { departmentId: null },
        { departmentId: requestUser.departmentId }
      ]
    });
  }

  // Dynamic filters
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;

  const notices = await Notice.find(query)
    .populate('departmentId', 'name code')
    .populate('createdBy', 'name email role')
    .sort({ pinned: -1, publishAt: -1 });

  // Enrich with read status for the current user
  const readLogs = await NoticeRead.find({ userId: requestUser.id });
  const readNoticeIds = new Set(readLogs.map(log => log.noticeId.toString()));

  return notices.map(n => ({
    ...n.toObject(),
    isRead: readNoticeIds.has(n._id.toString()),
  }));
};

export const updateNotice = async (noticeId, noticeData, requestUser) => {
  const notice = await Notice.findOne({ _id: noticeId, isDeleted: false });
  if (!notice) {
    throw new Error('Notice not found.');
  }

  if (requestUser.role === 'faculty' && notice.createdBy.toString() !== requestUser.id) {
    throw new Error('Forbidden: You can only edit notices created by yourself.');
  }

  const {
    title,
    content,
    category,
    priority,
    attachments,
    publishAt,
    expiryDate,
    pinned,
    departmentId,
    year,
    semester,
  } = noticeData;

  if (title) notice.title = title;
  if (content) notice.content = content;
  if (category) notice.category = category;
  if (priority) notice.priority = priority;
  if (attachments) notice.attachments = attachments;
  if (publishAt) notice.publishAt = new Date(publishAt);
  if (expiryDate !== undefined) notice.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (pinned !== undefined) notice.pinned = pinned;
  if (departmentId !== undefined) notice.departmentId = departmentId || null;
  if (year) notice.year = year;
  if (semester) notice.semester = semester;

  await notice.save();
  await logActivity(requestUser.id, 'UPDATE_NOTICE', 'Notice', `Updated notice: ${notice.title}`);
  return notice;
};

export const deleteNotice = async (noticeId, requestUser) => {
  const notice = await Notice.findOne({ _id: noticeId, isDeleted: false });
  if (!notice) {
    throw new Error('Notice not found.');
  }

  if (requestUser.role === 'faculty' && notice.createdBy.toString() !== requestUser.id) {
    throw new Error('Forbidden: You can only delete notices created by yourself.');
  }

  notice.isDeleted = true;
  notice.deletedAt = new Date();
  await notice.save();

  await logActivity(requestUser.id, 'DELETE_NOTICE', 'Notice', `Deleted notice: ${notice.title}`);
  return notice;
};

export const markAsRead = async (noticeId, userId) => {
  const notice = await Notice.findOne({ _id: noticeId, isDeleted: false });
  if (!notice) {
    throw new Error('Notice not found.');
  }

  const noticeRead = await NoticeRead.findOneAndUpdate(
    { noticeId, userId },
    { readAt: new Date() },
    { upsert: true, new: true }
  );

  return noticeRead;
};
