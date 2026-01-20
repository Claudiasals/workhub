import ProductModel from "../../../db/models/Product.js";
import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";

// Retrieve all products (accessible by user and admin)
export const listProducts = async (req, res) => {
  try {
    const products = await ProductModel.find().lean(); // Fetch all products as plain JavaScript objects

    return res
      .status(200)
      .json(formatResponse(products, true, "Products list"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Retrieve a single product by ID (accessible by user and admin)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params; // Extract product ID from route parameters

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid product ID"));
    }

    const product = await ProductModel.findById(id).lean(); // Fetch product by ID

    // Handle product not found
    if (!product) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Product not found"));
    }

    return res
      .status(200)
      .json(formatResponse(product, true, "Product found"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
