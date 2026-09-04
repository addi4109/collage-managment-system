import * as calendarService from '../services/calendarService.js';

export const createEvent = async (req, res) => {
  try {
    const event = await calendarService.createEvent(req.body, req.user);
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: error.message || 'Internal server error creating event.' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await calendarService.getEvents(req.user);
    res.json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ message: error.message || 'Internal server error fetching events.' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await calendarService.updateEvent(eventId, req.body, req.user.id, req.user.role);
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: error.message || 'Internal server error updating event.' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    await calendarService.deleteEvent(eventId, req.user.id, req.user.role);
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: error.message || 'Internal server error deleting event.' });
  }
};
