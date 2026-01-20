import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as ticketApi from "../../api/ticketApi";

const initialState = {
  users: [],
  tickets: [],
  status: "idle",
  error: null,
};

const extractError = (err) => {
  if (typeof err === 'string') return err;
  return err?.message || "Operazione fallita";
};

const getToken = () => {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

const deriveUsersFromTickets = (tickets) =>
  Array.from(
    new Map(tickets.map((t) => [t.user?._id || t.user?.id, t.user])).values()
  ).filter(Boolean);

export const fetchTickets = createAsyncThunk(
  "tickets/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Token non trovato");

      const { response, data } = await ticketApi.fetchTicketsRequest(token);
      if (!response.ok) return rejectWithValue(data?.error || "Errore nel fetch");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const createTicketAsync = createAsyncThunk(
  "tickets/create",
  async (payload, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Token non trovato");

      const { response, data } = await ticketApi.createTicketRequest({ payload, token });
      if (!response.ok) return rejectWithValue({ message: data?.error || "Errore nella creazione", details: data?.details || data });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateTicketAsync = createAsyncThunk(
  "tickets/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Token non trovato");

      const { response, data } = await ticketApi.updateTicketRequest({ id, payload, token });
      if (!response.ok) return rejectWithValue({ message: data?.error || "Errore nell'aggiornamento", details: data?.details || data });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteTicketAsync = createAsyncThunk(
  "tickets/delete",
  async (id, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Token non trovato");

      const { response, data } = await ticketApi.deleteTicketRequest({ id, token });
      if (!response.ok) return rejectWithValue({ message: data?.error || "Errore nell'eliminazione", details: data?.details || data });
      return { id };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTickets.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tickets = action.payload || [];
        state.users = deriveUsersFromTickets(action.payload || []);
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // create
      .addCase(createTicketAsync.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createTicketAsync.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicketAsync.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // update
      .addCase(updateTicketAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTicketAsync.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex((t) => (t._id || t.id) === (action.payload._id || action.payload.id));
        if (idx !== -1) state.tickets[idx] = action.payload;
      })
      .addCase(updateTicketAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      // delete
      .addCase(deleteTicketAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTicketAsync.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter((t) => (t._id || t.id) !== action.payload.id);
      })
      .addCase(deleteTicketAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

// Selectors  
export const selectTickets = (state) => state.tickets.tickets;
export const selectUsers = (state) => state.tickets.users;
export const selectTicketStatus = (state) => state.tickets.status;
export const selectTicketError = (state) => state.tickets.error;

export default ticketSlice.reducer;