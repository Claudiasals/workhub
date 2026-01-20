import Joi from "joi";
import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";
import { AffiliateProgram, Client, Order } from "../../../db/index.js";
import { generateRandomCardNumber } from "../../../utils/random.js";

// Get all customers
// GET /api/v1/customers
export const getCustomers = async (req, res) => {
  try {
    // Fetch all customers with populated affiliate program
    const customers = await Client.find({}, null, { lean: true }).populate({
      path: "affiliateProgram",
      select: "name points cardNumber",
    });

    return res
      .status(200)
      .json(formatResponse(customers, true, "Customers list"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Get customer by ID
// GET /api/v1/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid customer ID"));
    }

    // Fetch customer with affiliate program
    const customer = await Client.findById(id)
      .populate({
        path: "affiliateProgram",
        select: "name points cardNumber",
      })
      .lean();

    if (!customer) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Customer not found"));
    }

    // Fetch orders associated with the customer
    const orders = await Order.find({
      clients: {
        $elemMatch: { client: customer._id },
      },
    })
      .populate(["product", "pointOfSales"])
      .lean();

    // Map orders to customer-specific structure
    customer.orders =
      orders.map((order) => ({
        _id: order._id,
        pointOfSales: order.pointOfSales,
        product: order.product,
        quantity: order.clients.find(
          (c) => c.client.toString() === customer._id.toString()
        )?.quantity,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })) || [];

    return res
      .status(200)
      .json(formatResponse(customer, true, "Customer found"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Create new customer
// POST /api/v1/customers
export const createCustomer = async (req, res) => {
  // Request body validation schema
  const schema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    location: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
    birthDate: Joi.string().required(),
    fiscalCode: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    affiliateProgram: Joi.object({
      name: Joi.string().valid("standard", "premium").default("standard"),
    }),
  });

  try {
    // Validate request body
    const {
      affiliateProgram: { name: affiliateProgramName },
      ...customerData
    } = await schema.validateAsync(req.body);

    // Generate unique loyalty card number
    const cardNumber = generateRandomCardNumber(6, true);

    // Create affiliate program document
    const affiliateProgram = new AffiliateProgram({
      name: "standard",
      points: 0,
      cardNumber,
    });

    // Assign affiliate program to customer
    customerData.affiliateProgram = affiliateProgram._id;

    // Create customer document
    const newCustomer = new Client(customerData);

    // Link customer to affiliate program
    affiliateProgram.name = affiliateProgramName;
    affiliateProgram.user = newCustomer._id;

    // Persist documents
    await affiliateProgram.save();
    await newCustomer.save();

    // Reload customer with populated affiliate program
    const populatedCustomer = await Client.findById(newCustomer._id)
      .populate({
        path: "affiliateProgram",
        select: "name points cardNumber",
      })
      .lean();

    return res.status(201).json(
      formatResponse(
        populatedCustomer,
        true,
        "Customer added successfully"
      )
    );
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Update existing customer
// PATCH /api/v1/customers/:id
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid customer ID"));
    }

    // Update customer data
    const updatedCustomer = await Client.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "affiliateProgram",
      select: "name points cardNumber",
    });

    if (!updatedCustomer) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Customer not found"));
    }

    return res
      .status(200)
      .json(
        formatResponse(updatedCustomer, true, "Customer updated successfully")
      );
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};

// Delete customer
// DELETE /api/v1/customers/:id
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(formatResponse(null, false, "Invalid customer ID"));
    }

    // Remove customer from database
    const deletedCustomer = await Client.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res
        .status(404)
        .json(formatResponse(null, false, "Customer not found"));
    }

    return res
      .status(200)
      .json(formatResponse(null, true, "Customer deleted successfully"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
