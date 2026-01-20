// Import necessary functions from Redux Toolkit
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Import API request functions for shifts
import {
	fetchAllShiftsRequest,
	fetchUserShiftsRequest,
	updateShiftRequest,
	deleteShiftRequest,
} from "../../api/shiftsApi";

/* ------------------- GET ALL ------------------- */
// Async thunk to fetch all shifts from the server
export const fetchAllShiftsAsync = createAsyncThunk(
	"shifts/fetchAll",
	async ({ token }, { rejectWithValue }) => {
		try {
			// Call the API to fetch all shifts
			const { res, data } = await fetchAllShiftsRequest({ token });

			// If response is not OK, reject with error message
			if (!res.ok) return rejectWithValue(data.message);

			// Return the data if successful
			return data.data;
		} catch {
			// Handle network errors
			return rejectWithValue("Errore di rete.");
		}
	}
);

/* ------------------- GET BY USER ------------------- */
// Async thunk to fetch shifts for a specific user
export const fetchUserShiftsAsync = createAsyncThunk(
	"shifts/fetchByUser",
	async ({ userId, token }, { rejectWithValue }) => {
		try {
			// Call the API to fetch shifts by user
			const { res, data } = await fetchUserShiftsRequest({ userId, token });

			// If response is not OK, reject with error message
			if (!res.ok) return rejectWithValue(data.message);

			// Return the data if successful
			return data.data;
		} catch {
			// Handle network errors
			return rejectWithValue("Errore di rete.");
		}
	}
);

/* ------------------- UPDATE SINGLE DAY/PERIOD ------------------- */
// Async thunk to update a shift for a specific day or period
export const updateShiftAsync = createAsyncThunk(
	"shifts/update",
	async ({ id, day, period, value, token }, { rejectWithValue }) => {
		try {
			// Call the API to update the shift
			const { res, data } = await updateShiftRequest({
				id,
				day,
				period,
				value,
				token,
			});

			// If response is not OK, reject with error message
			if (!res.ok) return rejectWithValue(data.message);

			// Return the updated data if successful
			return data.data;
		} catch {
			// Handle network errors
			return rejectWithValue("Errore di rete.");
		}
	}
);

/* ------------------- DELETE SHIFT DOC ------------------- */
// Async thunk to delete a shift document
export const deleteShiftAsync = createAsyncThunk(
	"shifts/delete",
	async ({ id, token }, { rejectWithValue }) => {
		try {
			// Call the API to delete the shift
			const { res, data } = await deleteShiftRequest({ id, token });

			// If response is not OK, reject with error message
			if (!res.ok) return rejectWithValue(data.message);

			// Return the deleted shift's id if successful
			return id;
		} catch {
			// Handle network errors
			return rejectWithValue("Errore di rete.");
		}
	}
);

/* ------------------- SLICE ------------------- */
// Create the shifts slice with initial state and reducers
const shiftsSlice = createSlice({
	name: "shifts",
	initialState: {
		list: [], // List of all shifts
		current: null, // Currently selected or viewed shift
		loading: false, // Loading state for async actions
		error: null, // Error message, if any
	},

	reducers: {}, // No synchronous reducers defined

	// Handle async actions with extraReducers
	extraReducers: (builder) => {
		builder
			// Handle fetchAllShiftsAsync actions
			.addCase(fetchAllShiftsAsync.pending, (s) => {
				s.loading = true;
				s.error = null;
			})
			.addCase(fetchAllShiftsAsync.fulfilled, (s, a) => {
				s.loading = false;
				s.list = a.payload;
			})
			.addCase(fetchAllShiftsAsync.rejected, (s, a) => {
				s.loading = false;
				s.error = a.payload;
			})

			// Handle fetchUserShiftsAsync actions
			.addCase(fetchUserShiftsAsync.pending, (s) => {
				s.loading = true;
				s.error = null;
			})
			.addCase(fetchUserShiftsAsync.fulfilled, (s, a) => {
				s.loading = false;
				s.current = a.payload;
			})
			.addCase(fetchUserShiftsAsync.rejected, (s, a) => {
				s.loading = false;
				s.error = a.payload;
			})

			// Handle updateShiftAsync fulfilled action
			.addCase(updateShiftAsync.fulfilled, (s, a) => {
				s.current = a.payload;
			})

			// Handle deleteShiftAsync fulfilled action
			.addCase(deleteShiftAsync.fulfilled, (s, a) => {
				// Remove the deleted shift from the list
				s.list = s.list.filter((x) => x._id !== a.payload);
				// If the current shift is the one deleted, reset current
				if (s.current?._id === a.payload) s.current = null;
			});
	},
});

// Export the reducer as default
export default shiftsSlice.reducer;
