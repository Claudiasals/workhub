import OrderModel from "../../../db/models/Order.js";
import ClientModel from "../../../db/models/Client.js";
import ProductsModel from "../../../db/models/Product.js";
import AffiliateProgramModel from "../../../db/models/AffiliateProgram.js";
import { formatResponse } from "../../../utils/format.js";
import { calculateAffiliatePoints } from "../../../utils/orders.js";

import Joi from "joi";
import mongoose from "mongoose";

// Orders required to upgrade a client to Premium
const PREMIUM_AFTER_ORDERS = 10;

// Joi custom validator for MongoDB ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Validation schema for order creation
const createOrderSchema = Joi.object({
  pointOfSales: Joi.string().custom(objectId).required(),
  product: Joi.string().custom(objectId).required(),
  totalQuantity: Joi.number().min(1).required(),
  clients: Joi.array()
    .items(
      Joi.object({
        client: Joi.string().custom(objectId).required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .min(1)
    .required(),
  stato: Joi.string()
    .valid("Inviato", "In lavorazione", "Consegnato")
    .default("Inviato"),
  corriere: Joi.string().default("Bartolini"),
  note: Joi.string().allow("").optional(),
}).unknown(false);

// Validation schema for order update
const updateOrderSchema = Joi.object({
  pointOfSales: Joi.string().custom(objectId),
  product: Joi.string().custom(objectId),
  totalQuantity: Joi.number().min(1),
  clients: Joi.array().items(
    Joi.object({
      client: Joi.string().custom(objectId),
      quantity: Joi.number().min(1),
    })
  ),
  stato: Joi.string().valid("Inviato", "In lavorazione", "Consegnato"),
  corriere: Joi.string(),
  note: Joi.string().allow(""),
}).unknown(false);

// Create a new order and handle affiliate points logic
export const createOrder = async (req, res) => {
  try {
    const { error } = createOrderSchema.validate(req.body, { abortEarly: false });

    const { clients, totalQuantity } = req.body;

    // Ensure client quantities do not exceed total quantity
    const totalClientQuantity = clients.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    if (totalClientQuantity > totalQuantity) {
      return res.status(400).json({
        error: "Validation error",
        message: "Client quantities exceed total quantity",
      });
    }

    // Prevent duplicate clients in the order
    const clientIds = clients.map((c) => c.client);
    if (new Set(clientIds).size < clientIds.length) {
      return res.status(400).json({
        error: "Validation error",
        message: "Duplicate clients detected",
      });
    }

    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    const order = new OrderModel(req.body);
    await order.save();

    const product = await ProductsModel.findById(order.product);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const unitPrice = Number(product.price) || 0;

    const premiumProgram = await AffiliateProgramModel.findOne({
      name: "Premium",
    });

    // Assign affiliate points to each client
    await Promise.all(
      clients.map(async ({ client, quantity }) => {
        const clientDoc = await ClientModel.findById(client);
        if (!clientDoc?.affiliateProgram) return;

        const affiliateProgram = await AffiliateProgramModel.findById(
          clientDoc.affiliateProgram
        );
        if (!affiliateProgram) return;

        const orderAmount = quantity * unitPrice;
        const points = calculateAffiliatePoints(
          orderAmount,
          affiliateProgram.name
        );

        if (points > 0) {
          await AffiliateProgramModel.findByIdAndUpdate(
            affiliateProgram._id,
            { $inc: { points } }
          );
        }

        // Upgrade client to Premium if conditions are met
        if (
          premiumProgram &&
          affiliateProgram.name === "Standard"
        ) {
          const totalOrders = await OrderModel.countDocuments({
            "clients.client": clientDoc._id,
          });

          if (totalOrders >= PREMIUM_AFTER_ORDERS) {
            await ClientModel.findByIdAndUpdate(clientDoc._id, {
              affiliateProgram: premiumProgram._id,
            });
          }
        }
      })
    );

    const populatedOrder = await order.populate([
      "pointOfSales",
      "product",
      "clients.client",
    ]);

    return res.status(201).json(populatedOrder);
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Retrieve all orders with enriched client data
export const getOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("pointOfSales")
      .populate("product")
      .populate("clients.client");

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const enrichedClients = await Promise.all(
          order.clients.map(async (c) => {
            let puntiOrdine = 0;
            let puntiTotali = 0;
            let ordiniTotali = 0;

            if (c.client?.affiliateProgram) {
              const affiliateProgram = await AffiliateProgramModel.findById(
                c.client.affiliateProgram
              );

              if (affiliateProgram) {
                const totalAmount =
                  Number(order.product?.price || 0) *
                  Number(order.totalQuantity || 1);

                const unitPrice = totalAmount / order.totalQuantity;
                const clientAmount = unitPrice * c.quantity;

                puntiOrdine = calculateAffiliatePoints(
                  clientAmount,
                  affiliateProgram.name
                );

                puntiTotali = affiliateProgram.points;

                ordiniTotali = await OrderModel.countDocuments({
                  "clients.client": c.client._id,
                });
              }
            }

            return {
              ...c.toObject(),
              puntiOrdine,
              puntiTotali,
              ordiniTotali,
            };
          })
        );

        return {
          ...order.toObject(),
          clients: enrichedClients,
        };
      })
    );

    return res.status(200).json(formatResponse(enrichedOrders));
  } catch (err) {
    return res
      .status(500)
      .json(formatResponse({ error: err.message }, false));
  }
};

// Retrieve a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .populate("pointOfSales")
      .populate("product")
      .populate("clients.client");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update an existing order
export const updateOrder = async (req, res) => {
  try {
    const { error } = updateOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    const order = await OrderModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(["pointOfSales", "product", "clients.client"]);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Delete an order by ID
export const deleteOrder = async (req, res) => {
  try {
    const order = await OrderModel.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res
      .status(200)
      .json({ message: "Order deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
