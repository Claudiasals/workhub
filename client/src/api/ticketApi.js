import { API_URL } from "../config/api";

// Fetch all tickets (GET)
export const fetchTicketsRequest = async (token) => {
  const response = await fetch(`${API_URL}/ticketing`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return { response, data };
};

// Fetch ticket by ID (GET)
export const fetchTicketByIdRequest = async ({ id, token }) => {
  const response = await fetch(`${API_URL}/ticketing/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return { response, data };
};

// Create a new ticket (POST)
export const createTicketRequest = async ({ payload, token }) => {
  const response = await fetch(`${API_URL}/ticketing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { response, data };
};

// Update an existing ticket (PUT)
export const updateTicketRequest = async ({ id, payload, token }) => {
  const response = await fetch(`${API_URL}/ticketing/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { response, data };
};

// Delete a ticket by ID (DELETE)
export const deleteTicketRequest = async ({ id, token }) => {
  const response = await fetch(`${API_URL}/ticketing/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return { response, data };
};
