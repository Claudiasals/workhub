import { API_URL } from "../config/api";

// Base Points Of Sales endpoint
const POS_URL = `${API_URL}/pointsofsales`;

// Fetch all points of sale (GET)
export const fetchPointsOfSalesRequest = async ({ token }) => {
  const res = await fetch(POS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};

// Create a new point of sale (POST)
export const createPointOfSaleRequest = async ({ newPos, token }) => {
  const res = await fetch(POS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newPos),
  });

  const data = await res.json();
  return { res, data };
};

// Update an existing point of sale (PATCH)
export const updatePointOfSaleRequest = async ({ id, updates, token }) => {
  const res = await fetch(`${POS_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  return { res, data };
};

// Delete a point of sale by ID (DELETE)
export const deletePointOfSaleRequest = async ({ id, token }) => {
  const res = await fetch(`${POS_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};
