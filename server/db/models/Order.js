import { Schema, model } from 'mongoose';

const OrderSchema = new Schema({
    pointOfSales: {
        type: Schema.Types.ObjectId,
        ref: 'PointOfSales',
        required: true,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
        index: true,
    },
    totalQuantity: {
        type: Number,
        required: true,
    },
     clients: [
      {
        client: {
          type: Schema.Types.ObjectId,
          ref: "Client",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ], 
    note: {
        type: String,
    }
}, { strict: true, timestamps: true, versionKey: false });

const OrderModel = model('Order', OrderSchema);

export default OrderModel;