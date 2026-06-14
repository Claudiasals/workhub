import Joi from "joi";
import { Item, Order, Shift, Leave, User } from "../../../db/index.js";
import { formatResponse } from "../../../utils/format.js";
import { handleRouteErrors } from "../../../utils/error.js";
import {
  analyzeShifts,
  classifyTicket,
  generateCommunication,
  generateTicketReply,
  getTicketSuggestions,
  getWarehouseSuggestions,
  isAiConfigured,
} from "../services/ai/features.js";
import TicketModel from "../../../db/models/Ticket.js";

export const getAiStatus = async (_req, res) => {
  return res.status(200).json(
    formatResponse(
      {
        configured: isAiConfigured(),
        mode: isAiConfigured() ? "ai" : "heuristic",
      },
      true,
      "AI status"
    )
  );
};

export const postClassifyTicket = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().min(1).max(2000).required(),
  });

  try {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(null, false, error.details[0].message));
    }

    const classification = await classifyTicket(value);
    return res.status(200).json(formatResponse(classification, true, "Ticket classified"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postWarehouseSuggestions = async (req, res) => {
  try {
    const [items, orders] = await Promise.all([
      Item.find()
        .populate({ path: "product", populate: { path: "category" } })
        .populate("pointOfSales")
        .lean(),
      Order.find().populate("product pointOfSales").lean(),
    ]);

    const result = await getWarehouseSuggestions({
      items,
      orders,
      lang: req.body?.lang === "en" ? "en" : "it",
    });
    return res
      .status(200)
      .json(formatResponse(result, true, "Warehouse suggestions generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postShiftAnalysis = async (req, res) => {
  try {
    const [shifts, leaves, users] = await Promise.all([
      Shift.find().lean(),
      Leave.find().populate("user", "firstName lastName department").lean(),
      User.find({ isActive: { $ne: false } }, "firstName lastName department").lean(),
    ]);

    const result = await analyzeShifts({ shifts, leaves, users });
    return res
      .status(200)
      .json(formatResponse(result, true, "Shift analysis generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postTicketSuggestions = async (req, res) => {
  try {
    const tickets = await TicketModel.find()
      .populate("user", "firstName lastName email")
      .lean();

    const result = await getTicketSuggestions({ tickets });
    return res
      .status(200)
      .json(formatResponse(result, true, "Ticket suggestions generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postTicketInsights = async (req, res) => {
  try {
    const { getTicketInsights } = await import(
      "../services/ticketInsights/TicketInsightsService.js"
    );

    const tickets = await TicketModel.find()
      .populate("user", "firstName lastName email department")
      .lean();

    const result = await getTicketInsights({ tickets });
    return res
      .status(200)
      .json(formatResponse(result, true, "Ticket insights generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postGenerateTicketReply = async (req, res) => {
  const schema = Joi.object({
    ticketTitle: Joi.string().trim().min(1).max(200).required(),
    ticketContent: Joi.string().trim().max(2000).allow("").default(""),
    keywords: Joi.string().trim().min(2).max(500).required(),
    lang: Joi.string().valid("it", "en").default("it"),
    userName: Joi.string().trim().max(120).allow("").default(""),
  });

  try {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(null, false, error.details[0].message));
    }

    const result = await generateTicketReply(value);
    return res
      .status(200)
      .json(formatResponse(result, true, "Ticket reply generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postGenerateCommunication = async (req, res) => {
  const schema = Joi.object({
    keywords: Joi.string().trim().min(3).max(500).required(),
    lang: Joi.string().valid("it", "en").default("it"),
  });

  try {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(null, false, error.details[0].message));
    }

    const result = await generateCommunication(value);
    return res
      .status(200)
      .json(formatResponse(result, true, "Communication generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postDashboardInsights = async (req, res) => {
  return postBusinessOverview(req, res);
};

export const postBusinessOverview = async (req, res) => {
  try {
    const { getBusinessOverview } = await import(
      "../services/businessOverview/BusinessOverviewAiService.js"
    );

    const [items, orders, tickets, shifts, leaves, users] = await Promise.all([
      Item.find()
        .populate({ path: "product", populate: { path: "category" } })
        .populate("pointOfSales")
        .lean(),
      Order.find()
        .populate({ path: "product", populate: { path: "category" } })
        .populate("pointOfSales")
        .lean(),
      TicketModel.find().lean(),
      Shift.find().lean(),
      Leave.find().populate("user", "firstName lastName department").lean(),
      User.find({ isActive: { $ne: false } }, "firstName lastName department").lean(),
    ]);

    const result = await getBusinessOverview({
      items,
      orders,
      tickets,
      shifts,
      leaves,
      users,
    });
    return res
      .status(200)
      .json(formatResponse(result, true, "Business overview generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postCustomerInsights = async (req, res) => {
  const schema = Joi.object({
    customerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  });

  try {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(null, false, error.details[0].message));
    }

    const { getCustomerInsights } = await import(
      "../services/customerAi/CustomerAiService.js"
    );

    const result = await getCustomerInsights(value.customerId);
    if (!result) {
      return res.status(404).json(formatResponse(null, false, "Customer not found"));
    }

    return res
      .status(200)
      .json(formatResponse(result, true, "Customer insights generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};

export const postCustomerPromoEmail = async (req, res) => {
  const schema = Joi.object({
    customerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    promotionIndex: Joi.number().integer().min(0).default(0),
    lang: Joi.string().valid("it", "en").default("it"),
  });

  try {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(null, false, error.details[0].message));
    }

    const { generateCustomerPromoEmail } = await import(
      "../services/customerAi/CustomerAiService.js"
    );

    const result = await generateCustomerPromoEmail(value);
    if (!result) {
      return res.status(404).json(formatResponse(null, false, "Customer not found"));
    }

    return res
      .status(200)
      .json(formatResponse(result, true, "Promo email generated"));
  } catch (err) {
    return handleRouteErrors(res, { error: err });
  }
};
