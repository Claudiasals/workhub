import PointOfSalesModel from "../../../db/models/PointOfSales.js";
import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";

// Retrieve all points of sale (admin only)
export const listPointsOfSales = async (req, res) => {
  try {
    const list = await PointOfSalesModel.find().lean(); // Fetch all POS as plain objects

    return res
      .status(200)
      .json(formatResponse(list, true, "Points of sale list"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Retrieve a single point of sale by ID (admin only)
export const getPointOfSaleById = async (req, res) => {
  try {
    const { id } = req.params; // Extract POS ID from route params

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid PointOfSale ID"));
    }

    const pos = await PointOfSalesModel.findById(id).lean(); // Fetch POS by ID

    if (!pos) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Point of sale not found"));
    }

    return res
      .status(200)
      .json(formatResponse(pos, true, "Point of sale found"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Create a new point of sale (admin only)
export const createPointOfSale = async (req, res) => {
  try {
    const newPOS = await PointOfSalesModel.create(req.body); // Create POS from request body

    return res
      .status(201)
      .json(formatResponse(newPOS, true, "Point of sale created"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update an existing point of sale (admin only)
export const updatePointOfSale = async (req, res) => {
  try {
    const { id } = req.params; // Extract POS ID from route params

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid PointOfSale ID"));
    }

    const updated = await PointOfSalesModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true } // Return updated document and enforce schema validation
    ).lean();

    if (!updated) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Point of sale not found"));
    }

    return res
      .status(200)
      .json(formatResponse(updated, true, "Point of sale updated"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Delete a point of sale by ID (admin only)
export const deletePointOfSale = async (req, res) => {
  try {
    const { id } = req.params; // Extract POS ID from route params

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid PointOfSale ID"));
    }

    const deleted = await PointOfSalesModel.findByIdAndDelete(id); // Remove POS from database

    if (!deleted) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Point of sale not found"));
    }

    return res
      .status(200)
      .json(formatResponse(null, true, "Point of sale deleted"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
