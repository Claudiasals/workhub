import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = "http://localhost:3030/api/v1";

// Fetch all customers
export const fetchCustomersAsync = createAsyncThunk(
  "customers/fetchAll",
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message);

      return data.data;
    } catch {
      return rejectWithValue("Network error.");
    }
  }
);

// Fetch customer by ID
export const fetchCustomerByIdAsync = createAsyncThunk(
  "customers/fetchById",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message);

      return data.data;
    } catch {
      return rejectWithValue("Network error.");
    }
  }
);

// Create new customer
export const createCustomerAsync = createAsyncThunk(
  "customers/create",
  async ({ newCustomer, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message);

      return data.data;
    } catch {
      return rejectWithValue("Network error.");
    }
  }
);

// Update existing customer
export const updateCustomerAsync = createAsyncThunk(
  "customers/update",
  async ({ id, updates, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message);

      return data.data;
    } catch {
      return rejectWithValue("Network error.");
    }
  }
);

// Delete customer
export const deleteCustomerAsync = createAsyncThunk(
  "customers/delete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message);

      return id;
    } catch {
      return rejectWithValue("Network error.");
    }
  }
);

const customerSlice = createSlice({
  name: "customers",

  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },

  reducers: {
    // Clear selected customer
    clearSelected(state) {
      state.selected = null;
    },

    // Clear error message
    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Create customer
      .addCase(createCustomerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createCustomerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all customers
      .addCase(fetchCustomersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCustomersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single customer
      .addCase(fetchCustomerByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCustomerByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update customer
      .addCase(updateCustomerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerAsync.fulfilled, (state, action) => {
        state.loading = false;

        // Update customer in list
        const index = state.list.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.list[index] = {
            ...state.list[index],
            ...action.payload,
          };
        }

        // Update selected customer while preserving relations
        if (state.selected?._id === action.payload._id) {
          state.selected = {
            ...state.selected,
            ...action.payload,
          };
        }
      })
      .addCase(updateCustomerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete customer
      .addCase(deleteCustomerAsync.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (c) => c._id !== action.payload
        );
        if (state.selected?._id === action.payload) {
          state.selected = null;
        }
      });
  },
});

export const { clearSelected, clearError } = customerSlice.actions;
export default customerSlice.reducer;
