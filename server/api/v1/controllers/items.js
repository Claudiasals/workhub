import { Item } from "../../../db/index.js";
import { handleRouteErrors } from "../../../utils/error.js";

// Create a new item
// POST /api/v1/items
export const createItem = async (req, res) => {
  try {
    // Create item using request body
    const newItem = new Item(req.body);

    // Persist item in database
    const savedItem = await newItem.save();

    // Return created resource
    return res.status(201).json(savedItem);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get all items with populated relations
// GET /api/v1/items
export const getAllItems = async (req, res) => {
  try {
    // Fetch all items and populate related product, category and POS
    const allItems = await Item.find()
      .populate({
        path: "product",
        populate: { path: "category" },
      })
      .populate("pointOfSales");

    return res.json(allItems);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get single item by ID
// GET /api/v1/items/:id
export const getItemById = async (req, res) => {
  try {
    // Find item by MongoDB ObjectId
    const itemById = await Item.findById(req.params.id)
      .populate("product")
      .populate("pointOfSales");

    if (!itemById) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.json(itemById);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update an existing item
// PATCH /api/v1/items/:id
export const updateItem = async (req, res) => {
  try {
    // Update item and return updated document
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.json(updatedItem);
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Increment or decrement item stock atomically
// PATCH /api/v1/items/:id/quantity
export const updateItemQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityToAdd } = req.body;

    // Validate quantity
    if (quantityToAdd === undefined || isNaN(quantityToAdd)) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    // Atomic stock update using $inc
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { $inc: { stock: quantityToAdd } },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.json(updatedItem);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};

// Delete an item
// DELETE /api/v1/items/:id
export const deleteItem = async (req, res) => {
  try {
    // Remove item by ID
    const deletedItem = await Item.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.json({
      message: "Item deleted successfully",
      deletedItem,
    });
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
