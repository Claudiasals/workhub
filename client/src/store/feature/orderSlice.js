import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrderRequest,
  fetchOrdersRequest,
  fetchOrderByIdRequest,
  updateOrderRequest,
  deleteOrderRequest,
} from "../../api/ordersApi";

// Create order
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async ({ orderData, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await createOrderRequest({ orderData, token });
      if (!res.ok) throw new Error("Order creation failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Fetch all orders
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async ({ token }, { rejectWithValue }) => {
    try {
      const { res, data } = await fetchOrdersRequest({ token });
      if (!res.ok) throw new Error("Orders fetch failed");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Fetch single order
export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await fetchOrderByIdRequest({ id, token });
      if (!res.ok) throw new Error("Order not found");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Update order
export const updateOrder = createAsyncThunk(
  "orders/updateOrder",
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const { res, data: updated } = await updateOrderRequest({
        id,
        data,
        token,
      });
      if (!res.ok) throw new Error("Order update failed");
      return updated;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Delete order
export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const { res } = await deleteOrderRequest({ id, token });
      if (!res.ok) throw new Error("Order deletion failed");
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const orderSlice = createSlice({
  name: "orders",

  initialState: {
    items: [],
    selectedOrder: null,
    loading: false,
    error: null,
  },

  reducers: {
    // Clear selected order
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch one
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.items.findIndex(
          (o) => o._id === action.payload._id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }

        if (
          state.selectedOrder &&
          state.selectedOrder._id === action.payload._id
        ) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (o) => o._id !== action.payload
        );
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
