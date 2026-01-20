import TicketModel from "../../../db/models/Ticket.js";
import { handleRouteErrors } from "../../../utils/error.js";

// Create a new ticket
export const createTickets = async (req, res) => {
  try {
    const payload = { ...req.body }; // Clone request body to avoid side effects

    // Ensure ticket name exists, fallback to title or timestamp-based name
    if (!payload.name) {
      const base = payload.title ? String(payload.title).trim() : "ticket";
      payload.name = `${base}-${Date.now()}`;
    }

    const newTicket = new TicketModel(payload); // Create ticket instance
    const savedTicket = await newTicket.save(); // Persist ticket to database

    // Populate user reference before returning response
    await savedTicket.populate("user", "firstName lastName email");

    return res.status(201).json(savedTicket); // Return created ticket
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }

    // Handle unique constraint violations
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "Duplicate key", details: error.keyValue });
    }

    return handleRouteErrors(res, { error });
  }
};

// Retrieve all tickets
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await TicketModel.find()
      .populate("user", "firstName lastName email"); // Populate user info

    return res.status(200).json(tickets);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Retrieve a single ticket by ID
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params; // Extract ticket ID from route params

    const ticket = await TicketModel.findById(id)
      .populate("user", "firstName lastName email avatar");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update a ticket by ID
export const updateTickets = async (req, res) => {
  try {
    const { id } = req.params; // Extract ticket ID

    const updatedTicket = await TicketModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true } // Return updated document
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json(updatedTicket);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Delete a ticket by ID
export const deleteTickets = async (req, res) => {
  try {
    const { id } = req.params; // Extract ticket ID

    const deletedTicket = await TicketModel.findByIdAndDelete(id);

    if (!deletedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
