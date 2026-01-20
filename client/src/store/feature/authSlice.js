import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Base API URL
const API_URL = "http://localhost:3030/api/v1"; // base API url

// LOGIN
// Async thunk for user login, supports 2FA code if provided
export const loginAsync = createAsyncThunk(
	"auth/login",
	async ({ username, password, code }, { rejectWithValue }) => {
		// include 2FA code
		try {
			const response = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password, code }), // include 2FA token if present
			});

			const data = await response.json();
			if (!response.ok) return rejectWithValue(data.message);
			if (!data.data.is2FARequired) {
				// normal login
				const authData = {
					token: data.data.token,
					user: data.data.user,
					role: data.data.user.role,
				};

				localStorage.setItem("auth", JSON.stringify(authData));
				return authData;
			} else {
				// login with code required
				// 2FA required, do not save anything
				return { is2FARequired: true };
			}
		} catch (error) {
			console.error("Login error:", error);
			return rejectWithValue("Network error.");
		}
	}
);

// CHANGE PASSWORD
// Async thunk for changing user password
export const changePasswordAsync = createAsyncThunk(
	"auth/changePassword",
	async ({ email, oldPassword, newPassword, token }, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/users/password`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ email, oldPassword, newPassword }),
			});

			const data = await response.json();
			if (!response.ok) return rejectWithValue(data.message);

			return true;
		} catch {
			return rejectWithValue("Network error.");
		}
	}
);

// RECOVER PASSWORD
// Async thunk for password recovery
export const recoverPasswordAsync = createAsyncThunk(
	"auth/recoverPassword",
	async ({ email, username }, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/auth/recover`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, username }),
			});

			const data = await response.json();
			if (!response.ok) return rejectWithValue(data.message);
			return data.data;
		} catch {
			return rejectWithValue("Network error.");
		}
	}
);

// ENABLE 2FA
// Async thunk to enable 2FA for the user
export const enable2FAAsync = createAsyncThunk(
	"auth/enable2FA",
	async ({ token }, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/auth/enable-2fa`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			if (!response.ok) return rejectWithValue(data.message);

			return data.data; // contains qr and uri
		} catch {
			return rejectWithValue("Network error.");
		}
	}
);

// DISABLE 2FA
// Async thunk to disable 2FA for the user
export const disable2FAAsync = createAsyncThunk(
	"auth/disable2FA",
	async ({ token }, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/auth/disable-2fa`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			if (!response.ok) return rejectWithValue(data.message);

			return true;
		} catch {
			return rejectWithValue("Network error.");
		}
	}
);

// VERIFY 2FA
// Async thunk to verify 2FA token for the user
export const verify2FAAsync = createAsyncThunk(
	"auth/verify2FA",
	async ({ userId, token2fa }, { rejectWithValue }) => {
		try {
			const response = await fetch(`${API_URL}/users/${userId}/2fa/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: token2fa }),
			});

			const data = await response.json();
			if (!response.ok) return rejectWithValue(data.message);

			return true;
		} catch {
			return rejectWithValue("Network error.");
		}
	}
);

// INITIAL STATE
// Load authentication data from localStorage if present
const storedAuth = JSON.parse(localStorage.getItem("auth")) || {
	user: null,
	token: null,
	role: null,
};

// Auth slice definition
const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: storedAuth.user,
		token: storedAuth.token,
		role: storedAuth.role,
		loading: false,
		error: null,
		recoveryLoading: false,
		recoveryError: null,
		recoveryMessage: null,
		twofaLoading: false,
		twofaError: null,
		twofaData: null, // contains QR and URI when enabling 2FA
		is2FARequired: false,
		loginData: {
			username: null,
			password: null,
		},
	},

	reducers: {
		// Logout reducer: clears localStorage and resets state
		logout: (state) => {
			localStorage.removeItem("auth");
			localStorage.removeItem("persist:root");
			state.user = null;
			state.token = null;
			state.role = null;
			state.twofaData = null;
			state.loginData.username = null;
			state.loginData.password = null;
		},
		// Set login data (username and password)
		setLoginData: (state, action) => {
			state.loginData = action.payload;
		},
		// Set 2FA required flag
		setIs2FARequired: (state, action) => {
			state.is2FARequired = action.payload;
		},
	},

	extraReducers: (builder) => {
		builder
			// LOGIN
			.addCase(loginAsync.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loginAsync.fulfilled, (state, action) => {
				state.loading = false;
				if (action.payload.is2FARequired) {
					state.is2FARequired = true;
					return;
				}
				state.user = action.payload.user;
				state.token = action.payload.token;
				state.role = action.payload.role;
			})
			.addCase(loginAsync.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})

			// PASSWORD
			.addCase(changePasswordAsync.fulfilled, (state) => {
				state.error = null;
			})
			.addCase(changePasswordAsync.rejected, (state, action) => {
				state.error = action.payload;
			})

			// RECOVERY
			.addCase(recoverPasswordAsync.pending, (state) => {
				state.recoveryLoading = true;
			})
			.addCase(recoverPasswordAsync.fulfilled, (state, action) => {
				state.recoveryLoading = false;
				state.recoveryMessage = action.payload;
			})
			.addCase(recoverPasswordAsync.rejected, (state, action) => {
				state.recoveryLoading = false;
				state.recoveryError = action.payload;
			})

			// ENABLE 2FA
			.addCase(enable2FAAsync.pending, (state) => {
				state.twofaLoading = true;
				state.twofaError = null;
			})
			.addCase(enable2FAAsync.fulfilled, (state, action) => {
				state.twofaLoading = false;
				state.twofaData = action.payload; // contains qr and uri
			})
			.addCase(enable2FAAsync.rejected, (state, action) => {
				state.twofaLoading = false;
				state.twofaError = action.payload;
			})

			// DISABLE 2FA
			.addCase(disable2FAAsync.fulfilled, (state) => {
				state.twofaData = null;
				state.twofaError = null;
			})
			.addCase(disable2FAAsync.rejected, (state, action) => {
				state.twofaError = action.payload;
			})

			// VERIFY 2FA
			.addCase(verify2FAAsync.fulfilled, (state) => {
				state.twofaError = null;
			})
			.addCase(verify2FAAsync.rejected, (state, action) => {
				state.twofaError = action.payload;
			});
	},
});


export const { logout, setLoginData, setIs2FARequired } = authSlice.actions;
export default authSlice.reducer;
