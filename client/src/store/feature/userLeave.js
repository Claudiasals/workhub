import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchLeaveRequest,
  fetchLeaveByUserIdRequest,
  createLeaveRequestRequest,
  updateLeaveStatusRequest,
  initLeaveRecordRequest,
} from "../../api/leaveApi";

// Fetch current user leave record
export const fetchLeaveAsync = createAsyncThunk(
  "leave/fetch",
  async (token, { rejectWithValue }) => {
    try {
      const { res, data } = await fetchLeaveRequest(token);
      if (!res.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Fetch leave record by user id (admin)
export const fetchLeaveByUserIdAsync = createAsyncThunk(
  "leave/fetchByUserId",
  async ({ userId, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await fetchLeaveByUserIdRequest({ userId, token });
      if (!res.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Create a new leave request
export const createLeaveRequestAsync = createAsyncThunk(
  "leave/createRequest",
  async ({ payload, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await createLeaveRequestRequest({ payload, token });
      if (!res.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Update leave request status (admin)
export const updateLeaveStatusAsync = createAsyncThunk(
  "leave/updateStatus",
  async ({ requestId, status, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await updateLeaveStatusRequest({
        requestId,
        status,
        token,
      });
      if (!res.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Initialize leave record for user (admin)
export const initLeaveRecordAsync = createAsyncThunk(
  "leave/initRecord",
  async ({ userId, token }, { rejectWithValue }) => {
    try {
      const { res, data } = await initLeaveRecordRequest({ userId, token });
      if (!res.ok) return rejectWithValue(data.message);
      return data.data;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Leave slice
const userLeaveSlice = createSlice({
  name: "leave",
  initialState: {
    record: null,    // Current leave record
    loading: false,  // Loading state
    error: null,     // Error message
  },

  reducers: {
    // Reset leave state
    clearLeave(state) {
      state.record = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch leave
      .addCase(fetchLeaveAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.record = action.payload;
      })
      .addCase(fetchLeaveAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch leave by user id
      .addCase(fetchLeaveByUserIdAsync.fulfilled, (state, action) => {
        state.record = action.payload;
      })

      // Create leave request
      .addCase(createLeaveRequestAsync.fulfilled, (state, action) => {
        state.record = action.payload;
      })

      // Update leave status
      .addCase(updateLeaveStatusAsync.fulfilled, (state, action) => {
        state.record = action.payload;
      })

      // Initialize leave record
      .addCase(initLeaveRecordAsync.fulfilled, (state, action) => {
        state.record = action.payload;
      });
  },
});

export const { clearLeave } = userLeaveSlice.actions;
export default userLeaveSlice.reducer;
