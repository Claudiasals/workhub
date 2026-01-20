import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUserRequest,
  fetchUsersRequest,
  fetchUserByIdRequest,
  updateUserRequest,
  deleteUserRequest,
} from "../../api/usersApi";

// Create new user (admin)
export const createUserAsync = createAsyncThunk(
  "users/create",
  async ({ newUser, token }, { rejectWithValue }) => {
    try {
      const { response, data } = await createUserRequest({ newUser, token });
      if (!response.ok) return rejectWithValue(data.message);
      // Backend returns { user, tempPassword }
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Fetch all users
export const fetchUsersAsync = createAsyncThunk(
  "users/fetchAll",
  async (token, { rejectWithValue }) => {
    try {
      const { response, data } = await fetchUsersRequest(token);
      if (!response.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Fetch single user by id
export const fetchUserByIdAsync = createAsyncThunk(
  "users/fetchById",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const { response, data } = await fetchUserByIdRequest({ id, token });
      if (!response.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Update user data
export const updateUserAsync = createAsyncThunk(
  "users/update",
  async ({ id, updates, token }, { rejectWithValue }) => {
    try {
      const { response, data } = await updateUserRequest({
        id,
        updates,
        token,
      });
      if (!response.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Delete user
export const deleteUserAsync = createAsyncThunk(
  "users/delete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const { response, data } = await deleteUserRequest({ id, token });
      if (!response.ok) return rejectWithValue(data.message);
      return id;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Users slice
const userSlice = createSlice({
  name: "users",

  initialState: {
    list: [],       // Users list
    selected: null, // Selected user
    loading: false, // Loading state
    error: null,    // Error message
  },

  reducers: {
    // Clear selected user
    clearSelected(state) {
      state.selected = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Create user
      .addCase(createUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.user) {
          state.list.push(action.payload.user);
        }
      })
      .addCase(createUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all users
      .addCase(fetchUsersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single user
      .addCase(fetchUserByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchUserByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update user
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (u) => u._id === action.payload._id
        );
        if (index !== -1) state.list[index] = action.payload;

        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
      })

      // Delete user
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (u) => u._id !== action.payload
        );
        if (state.selected?._id === action.payload) {
          state.selected = null;
        }
      });
  },
});

export const { clearSelected } = userSlice.actions;
export default userSlice.reducer;
