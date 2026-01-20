import mongoose from 'mongoose';

import UserModel from './models/User.js';
import PointOfSalesModel from './models/PointOfSales.js';
import ItemModel from './models/Item.js';
import ProductModel from './models/Product.js';
import CategoryModel from './models/Category.js';
import AffiliateProgramModel from './models/AffiliateProgram.js';
import ClientModel from './models/Client.js';
import OrderModel from './models/Order.js';
import TicketModel from './models/Ticket.js';
import EventModel from './models/Event.js';
import UserLeaveModel from './models/UserLeave.js';
import UserShiftModel from './models/UserShift.js';




/**
 * Connects to the MongoDB database using the connection URI from environment variables.
 */
export const connect = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_URI);
    
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Disconnects from the MongoDB database.
 */
export const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

// Export models
export const User = UserModel;
export const PointOfSales = PointOfSalesModel;
export const Item = ItemModel;
export const Product = ProductModel;
export const Category = CategoryModel;
export const AffiliateProgram = AffiliateProgramModel;
export const Client = ClientModel;
export const Order = OrderModel;
export const Ticket = TicketModel;
export const Event = EventModel;
export const Leave = UserLeaveModel;
export const Shift = UserShiftModel;
