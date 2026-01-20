import { API_URL } from "../config/api";

// Fetch all events (GET)
export const fetchEvents = async (token) => {
  const response = await fetch(`${API_URL}/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const json = await response.json();
  return json.data;
};

// Create a new event (POST)
export const createEvent = async (data, token) => {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create event");
  }

  const json = await response.json();
  return json.data;
};

// Update an existing event (PUT)
export const updateEvent = async (id, data, token) => {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update event");
  }

  const json = await response.json();
  return json.data;
};

// Delete an event by ID (DELETE)
export const deleteEvent = async (id, token) => {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete event");
  }
};
