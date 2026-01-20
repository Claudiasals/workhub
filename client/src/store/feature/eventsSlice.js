import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../api/eventsApi";

// Fetch all events
export const fetchEventsAsync = createAsyncThunk(
  "events/fetchEvents",
  async ({ token }) => {
    return await fetchEvents(token);
  }
);

// Create new event
export const createEventAsync = createAsyncThunk(
  "events/createEvent",
  async ({ data, token }) => {
    return await createEvent(data, token);
  }
);

// Update existing event
export const updateEventAsync = createAsyncThunk(
  "events/updateEvent",
  async ({ id, data, token }) => {
    return await updateEvent(id, data, token);
  }
);

// Delete event
export const deleteEventAsync = createAsyncThunk(
  "events/deleteEvent",
  async ({ id, token }) => {
    await deleteEvent(id, token);
    return { id };
  }
);

const eventsSlice = createSlice({
  name: "events",

  initialState: {
    events: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEventsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEventsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create event
      .addCase(createEventAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEventAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
      })
      .addCase(createEventAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update event
      .addCase(updateEventAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEventAsync.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload;
        const index = state.events.findIndex(
          (ev) => ev._id === updated._id
        );

        if (index !== -1) {
          state.events[index] = updated;
        }
      })
      .addCase(updateEventAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete event
      .addCase(deleteEventAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEventAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter(
          (ev) => ev._id !== action.payload.id
        );
      })
      .addCase(deleteEventAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default eventsSlice.reducer;
