import { API_URL } from "../config/api";

// Fetch current user's leave requests
export const fetchLeaveRequest = async (token) => {
  const res = await fetch(`${API_URL}/leaves`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};

// Fetch leave requests by user ID (admin only)
export const fetchLeaveByUserIdRequest = async ({ userId, token }) => {
  const res = await fetch(`${API_URL}/leaves/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};

// Create a new leave request
export const createLeaveRequestRequest = async ({ payload, token }) => {
  const res = await fetch(`${API_URL}/leaves/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { res, data };
};

// Update leave request status (admin only)
export const updateLeaveStatusRequest = async ({
  requestId,
  status,
  token,
}) => {
  const res = await fetch(`${API_URL}/leaves/${requestId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  return { res, data };
};

// Initialize leave record for a user (admin only)
export const initLeaveRecordRequest = async ({ userId, token }) => {
  const res = await fetch(`${API_URL}/leaves/init/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};
