import { API_URL } from "../config/api";

// Authenticate user and return auth payload
export const loginRequest = async ({ username, password }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  return { ok: response.ok, data };
};

// Update user password using authenticated token
export const changePasswordRequest = async ({
  email,
  oldPassword,
  newPassword,
  token,
}) => {
  const response = await fetch(`${API_URL}/users/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, oldPassword, newPassword }),
  });

  const data = await response.json();
  return { ok: response.ok, data };
};

// Trigger password recovery via email or username
export const recoverPasswordRequest = async ({ email, username }) => {
  const response = await fetch(`${API_URL}/auth/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username }),
  });

  const data = await response.json();
  return { ok: response.ok, data };
};
