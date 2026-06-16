import Joi from "joi";
import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";
import UserShiftModel from "../../../db/models/UserShift.js";
import UserModel from "../../../db/models/User.js";
import { SHIFT_PERIOD_KEYS } from "../../../utils/shiftPeriods.js";

const shiftPopulate = {
  path: "user",
  select: "firstName lastName email personnelNumber department workplace",
};

// Get shift documents for users at the requester's workplace
export const getWorkplaceShifts = async (req, res) => {
  try {
    const workplaceId = req.user?.workplace?._id || req.user?.workplace;
    const isAdmin = req.user?.role === "admin";

    let userFilter = { isActive: { $ne: false } };

    if (workplaceId) {
      userFilter.workplace = workplaceId;
    } else if (!isAdmin) {
      userFilter._id = req.user._id;
    }

    const users = await UserModel.find(userFilter).select("_id").lean();
    const userIds = users.map((user) => user._id);

    if (userIds.length === 0) {
      return res
        .status(200)
        .json(formatResponse([], true, "Workplace shifts retrieved"));
    }

    const shifts = await UserShiftModel.find({ user: { $in: userIds } })
      .populate(shiftPopulate)
      .lean();

    return res
      .status(200)
      .json(formatResponse(shifts, true, "Workplace shifts retrieved"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get all shift documents (admin)
export const getAllShifts = async (req, res) => {
  try {
    const shifts = await UserShiftModel.find()
      .populate(shiftPopulate)
      .lean();

    return res
      .status(200)
      .json(formatResponse(shifts, true, "All shifts retrieved"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get or create shifts for a specific user
export const getShiftsByUser = async (req, res) => {
  try {
    const { userId } = req.params; // User ID

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid user ID"));
    }

    let userShift = await UserShiftModel.findOne({ user: userId }).lean();

    // Auto-create shift document if missing
    if (!userShift) {
      const created = await UserShiftModel.create({ user: userId });
      userShift = created.toObject();
    }

    return res
      .status(200)
      .json(formatResponse(userShift, true, "User shifts retrieved"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update a single day/period value
export const updateShift = async (req, res) => {
  const { id } = req.params; // Shift document ID

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json(formatResponse(null, false, "Invalid shift ID"));
  }

  const schema = Joi.object({
    day: Joi.string()
      .valid(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      )
      .required(),
    period: Joi.string().valid(...SHIFT_PERIOD_KEYS).required(),
    value: Joi.boolean().required(),
  });

  try {
    const { value, error } = schema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json(formatResponse(null, false, error.details[0].message));
    }

    const { day, period, value: boolValue } = value;
    const update = { [`shifts.${day}.${period}`]: boolValue };

    if (boolValue) {
      SHIFT_PERIOD_KEYS.forEach((slot) => {
        if (slot !== period) {
          update[`shifts.${day}.${slot}`] = false;
        }
      });
    }

    const updated = await UserShiftModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Shift document not found"));
    }

    return res
      .status(200)
      .json(formatResponse(updated, true, "Shift updated successfully"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Delete an entire shift document
export const deleteShift = async (req, res) => {
  const { id } = req.params; // Shift document ID

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json(formatResponse(null, false, "Invalid shift ID"));
  }

  try {
    const deleted = await UserShiftModel.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Shift document not found"));
    }

    return res
      .status(200)
      .json(formatResponse(null, true, "Shift deleted"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
