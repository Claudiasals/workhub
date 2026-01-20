import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchProductsRequest,
  fetchProductByIdRequest,
} from "../../api/productApi";

// Fetch all products
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (token, { rejectWithValue }) => {
    try {
      const { res, data } = await fetchProductsRequest(token);
      if (!res.ok) {
        return rejectWithValue(
          data.message || "Failed to fetch products"
        );
      }
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Fetch a single product by ID
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await fetchProductByIdRequest(id, token);
      if (!res.ok) {
        return rejectWithValue(
          data.message || "Failed to fetch product"
        );
      }
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const productsSlice = createSlice({
  name: "products",

  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single product
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default productsSlice.reducer;
