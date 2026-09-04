import Event from '../models/Event.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { logActivity } from './activityLogService.js';

export const createEvent = async (eventData, user) => {
  const { title, description, eventType, startDate, endDate, departmentId, visibility, color } = eventData;
  const userRole = user.role;
  const creatorId = user.id;

  if (userRole === 'hod') {
    if (visibility === 'department' && departmentId) {
      if (user.departmentId && user.departmentId.toString() !== departmentId.toString()) {
        throw new Error('Forbidden: You can only create events for your assigned department.');
      }
    }
  }

  if (userRole === 'faculty') {
    throw new Error('Forbidden: Faculty cannot create events.');
  }

  const event = new Event({
    title,
    description: description || '',
    eventType: eventType || 'event',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    departmentId: visibility === 'department' ? departmentId : null,
    visibility: visibility || 'college',
    color: color || '#1976d2',
    createdBy: creatorId,
  });

  await event.save();
  await logActivity(creatorId, 'CREATE_EVENT', 'Calendar', `Created event: ${title}`);
  return event;
};

export const getEvents = async (user) => {
  const query = { isDeleted: false };

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user.id, isDeleted: false });
    if (student) {
      query.$or = [
        { visibility: 'college' },
        { visibility: 'department', departmentId: student.departmentId },
      ];
    } else {
      query.visibility = 'college';
    }
  } else if (user.role === 'faculty') {
    const faculty = await Faculty.findOne({ userId: user.id, isDeleted: false });
    if (faculty) {
      query.$or = [
        { visibility: 'college' },
        { visibility: 'department', departmentId: { $in: faculty.assignedDepartments } },
      ];
    } else {
      query.visibility = 'college';
    }
  } else if (user.role === 'hod') {
    query.$or = [
      { visibility: 'college' },
      { visibility: 'department', departmentId: user.departmentId },
      { createdBy: user.id },
    ];
  }

  return await Event.find(query)
    .populate('departmentId', 'name code')
    .sort({ startDate: 1 });
};

export const updateEvent = async (eventId, eventData, userId, userRole) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) {
    throw new Error('Event not found.');
  }

  if (userRole !== 'admin' && event.createdBy.toString() !== userId) {
    throw new Error('Forbidden: You can only update events created by yourself.');
  }

  const { title, description, eventType, startDate, endDate, departmentId, visibility, color } = eventData;

  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (eventType) event.eventType = eventType;
  if (startDate) event.startDate = new Date(startDate);
  if (endDate) event.endDate = new Date(endDate);
  if (color) event.color = color;

  if (visibility) {
    event.visibility = visibility;
    if (visibility === 'department') {
      event.departmentId = departmentId || null;
    } else {
      event.departmentId = null;
    }
  }

  await event.save();
  await logActivity(userId, 'UPDATE_EVENT', 'Calendar', `Updated event: ${event.title}`);
  return event;
};

export const deleteEvent = async (eventId, userId, userRole) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) {
    throw new Error('Event not found.');
  }

  if (userRole !== 'admin' && event.createdBy.toString() !== userId) {
    throw new Error('Forbidden: You can only delete events created by yourself.');
  }

  event.isDeleted = true;
  event.deletedAt = new Date();
  await event.save();

  await logActivity(userId, 'DELETE_EVENT', 'Calendar', `Deleted event: ${event.title}`);
  return { success: true };
};
