import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";
import { User } from "../../../db/index.js";
import { comparePassword, hashPassword } from "../../../utils/auth.js";

// Get all users without passwords (admin only)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password", { lean: true }).populate({
      path: "workplace",
      select: "name location",
    });

    return res
      .status(200)
      .json(formatResponse(users, true, "Users list"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get a single user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params; // User ID

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid user ID"));
    }

    const user = await User.findById(id, "-password")
      .populate({
        path: "workplace",
        select: "name location",
      })
      .lean();

    if (!user) {
      return res
        .status(404)
        .json(formatResponse(null, false, "User not found"));
    }

    return res
      .status(200)
      .json(formatResponse(user, true, "User found"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update user data excluding password (admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // User ID

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid user ID"));
    }

    // Prevent password update through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }

    const updated = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      select: "-password",
    }).populate({
      path: "workplace",
      select: "name location",
    });

    if (!updated) {
      return res
        .status(404)
        .json(formatResponse(null, false, "User not found"));
    }

    return res
      .status(200)
      .json(formatResponse(updated, true, "User updated successfully"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Delete a user by ID (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // User ID

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid user ID"));
    }

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json(formatResponse(null, false, "User not found"));
    }

    return res
      .status(200)
      .json(formatResponse(null, true, "User deleted successfully"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Change password for the authenticated user using email
export const changePasswordByEmail = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body; // Password payload

    // Validate required fields
    if (!email || !oldPassword || !newPassword) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Missing required fields"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json(formatResponse(null, false, "User not found"));
    }

    // Ensure users can change only their own password
    if (req.user.email !== email) {
      return res
        .status(403)
        .json(
          formatResponse(null, false, "Cannot change another user's password")
        );
    }

    const isValid = await comparePassword(oldPassword, user.password);

    if (!isValid) {
      return res
        .status(401)
        .json(formatResponse(null, false, "Old password is incorrect"));
    }

    user.password = await hashPassword(newPassword);
    user.isGeneratedPassword = false;

    await user.save();

    return res
      .status(200)
      .json(formatResponse(null, true, "Password changed successfully"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
