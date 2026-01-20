import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";
import { Leave } from "../../../db/index.js";

// Get leave record of the authenticated user (auto-create if missing)
export const getUserLeaves = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id; // Authenticated user ID

    let record = await Leave.findOne({ user: userId }).lean(); // Fetch leave record

    // Auto-create record if it does not exist
    if (!record) {
      record = await Leave.create({
        user: userId,
        vacationHours: 160,
        leaveHours: 20,
        requestedHours: [],
      });

      return res
        .status(201)
        .json(formatResponse(record, true, "User leave record created"));
    }

    return res
      .status(200)
      .json(formatResponse(record, true, "User leave record retrieved"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get leave record of a specific user (admin only)
export const getUserLeavesByAdmin = async (req, res) => {
  try {
    const { userId } = req.params; // Target user ID

    const record = await Leave.findOne({ user: userId }); // Fetch leave record

    if (!record) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Leave record not found"));
    }

    return res
      .status(200)
      .json(formatResponse(record, true, "Leave record retrieved"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Create a new leave or vacation request
export const createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id; // Authenticated user ID
    const { year, hours, mode, from, to, timeFrom, timeTo } = req.body; // Request payload

    // Basic required fields validation
    if (!year || !hours || !mode) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Missing required fields"));
    }

    let record = await Leave.findOne({ user: userId }); // Fetch leave record

    // Auto-create record if missing
    if (!record) {
      record = await Leave.create({
        user: userId,
        vacationHours: 160,
        leaveHours: 20,
        requestedHours: [],
      });
    }

    // Append new request
    record.requestedHours.push({
      year,
      hours,
      mode,
      from,
      to,
      timeFrom,
      timeTo,
      status: "pending",
    });

    await record.save(); // Persist changes

    return res
      .status(201)
      .json(formatResponse(record, true, "Leave request created"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update leave request status (admin only)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { requestId } = req.params; // Leave request ID
    const { status } = req.body; // New status

    // Validate request ID format
    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid request ID"));
    }

    // Validate allowed status values
    if (!["approved", "pending", "denied"].includes(status)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid status value"));
    }

    const record = await Leave.findOne({ "requestedHours._id": requestId }); // Locate record

    if (!record) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Leave request not found"));
    }

    const request = record.requestedHours.id(requestId); // Target request
    const previousStatus = request.status; // Previous state

    // Deduct hours when approving for the first time
    if (status === "approved" && previousStatus !== "approved") {
      if (request.mode === "vacation") {
        if (record.vacationHours < request.hours) {
          return res
            .status(400)
            .json(formatResponse(null, false, "Insufficient vacation hours"));
        }
        record.vacationHours -= request.hours;
      }

      if (request.mode === "leave") {
        if (record.leaveHours < request.hours) {
          return res
            .status(400)
            .json(formatResponse(null, false, "Insufficient leave hours"));
        }
        record.leaveHours -= request.hours;
      }
    }

    // Restore hours if approval is revoked
    if (previousStatus === "approved" && status !== "approved") {
      if (request.mode === "vacation") {
        record.vacationHours += request.hours;
      } else {
        record.leaveHours += request.hours;
      }
    }

    // Remove request if denied, otherwise update status
    if (status === "denied") {
      record.requestedHours = record.requestedHours.filter(
        (r) => r._id.toString() !== requestId
      );
    } else {
      request.status = status;
    }

    await record.save(); // Persist changes

    return res
      .status(200)
      .json(formatResponse(record, true, "Leave request status updated"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Initialize leave record for a user (admin utility)
export const initUserLeave = async (req, res) => {
  try {
    const { userId } = req.params; // Target user ID

    let record = await Leave.findOne({ user: userId }); // Check existing record

    if (record) {
      return res
        .status(200)
        .json(formatResponse(record, true, "Leave record already exists"));
    }

    record = await Leave.create({
      user: userId,
      vacationHours: 120,
      leaveHours: 40,
      requestedHours: [],
    });

    return res
      .status(201)
      .json(formatResponse(record, true, "Leave record initialized"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
