import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "../../config/api.js";
import * as api from "../../api/itemsApi.js";

// Fetch all items
export const fetchItems = createAsyncThunk(
  "items/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.fetchItems();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Update item stock quantity
export const updateItemQuantity = createAsyncThunk(
  "items/updateItemQuantity",
  async ({ id, quantityToAdd }, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;

      const res = await fetch(`${API_URL}/items/${id}/quantity`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ quantityToAdd }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return rejectWithValue(
          errorData.error || "Item update failed"
        );
      }

      const data = await res.json();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Create new item
export const addItem = createAsyncThunk(
  "items/addItem",
  async (newItem, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const itemsSlice = createSlice({
  name: "items",

  initialState: {
    list: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch items
      .addCase(fetchItems.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Add item
      .addCase(addItem.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      // Update item quantity
      .addCase(updateItemQuantity.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateItemQuantity.fulfilled, (state, action) => {
        state.status = "succeeded";

        const index = state.list.findIndex(
          (item) => item._id === action.payload._id
        );

        if (index !== -1) {
          state.list[index] = {
            ...state.list[index],
            stock: action.payload.stock,
          };
        }
      })
      .addCase(updateItemQuantity.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default itemsSlice.reducer;
