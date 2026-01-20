import Joi from "joi";
import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";
import Event from "../../../db/models/Event.js";

// Get all events
// GET /api/v1/events
// Accessible by users and admins
export const getAllEvents = async (req, res) => {
  try {
    // Fetch all events as plain JS objects
    const events = await Event.find({}, null, { lean: true });

    return res
      .status(200)
      .json(formatResponse(events, true, "Events list"));
  } catch (error) {
    return handleRouteErrors(res, { error, statusCode: 500 });
  }
};

// Get single event by ID
// GET /api/v1/events/:id
// Accessible by users and admins
export const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch event by MongoDB ObjectId
    const event = await Event.findById(id, null, { lean: true });

    if (!event) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Event not found"));
    }

    return res
      .status(200)
      .json(formatResponse(event, true, "Event found"));
  } catch (error) {
    return handleRouteErrors(res, { error, statusCode: 500 });
  }
};

// Create new event
// POST /api/v1/events
// Admin only
export const createEvent = async (req, res) => {
  // Joi validation schema
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    user: Joi.string().optional(),
  });

  try {
    // Validate request body
    const validatedData = await schema.validateAsync(req.body);

    // Create and save event
    const newEvent = await new Event(validatedData).save();

    return res
      .status(201)
      .json(
        formatResponse(
          newEvent.toObject(),
          true,
          "Event created successfully"
        )
      );
  } catch (error) {
    return handleRouteErrors(res, { error, statusCode: 500 });
  }
};

// Update existing event
// PUT /api/v1/events/:id
// Admin only
export const updateEvent = async (req, res) => {
  const { id } = req.params;

  // Joi validation schema for partial update
  const schema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    user: Joi.string().optional(),
  });

  try {
    // Validate request body
    const validatedData = await schema.validateAsync(req.body);

    // Update event and return updated document
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      validatedData,
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    );

    if (!updatedEvent) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Event not found"));
    }

    return res
      .status(200)
      .json(
        formatResponse(updatedEvent, true, "Event updated successfully")
      );
  } catch (error) {
    return handleRouteErrors(res, { error, statusCode: 500 });
  }
};

// Delete event
// DELETE /api/v1/events/:id
// Admin only
export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete event by ID
    const deletedEvent = await Event.findByIdAndDelete(id, { lean: true });

    if (!deletedEvent) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Event not found"));
    }

    return res
      .status(200)
      .json(
        formatResponse(deletedEvent, true, "Event deleted successfully")
      );
  } catch (error) {
    return handleRouteErrors(res, { error, statusCode: 500 });
  }
};
