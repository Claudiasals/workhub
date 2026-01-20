import { API_URL } from "../config/api";

// Base orders endpoint
const ORDERS_URL = `${API_URL}/orders`;

// Create a new order (POST)
export const createOrderRequest = async ({ orderData, token }) => {
  const res = await fetch(ORDERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  const data = await res.json();
  return { res, data };
};

// Fetch all orders (GET)
export const fetchOrdersRequest = async ({ token }) => {
  const res = await fetch(ORDERS_URL, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};

// Fetch a single order by ID (GET)
export const fetchOrderByIdRequest = async ({ id, token }) => {
  const res = await fetch(`${ORDERS_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};

// Update an existing order (PUT)
export const updateOrderRequest = async ({ id, data, token }) => {
  const res = await fetch(`${ORDERS_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  return { res, data: json };
};

// Delete an order by ID (DELETE)
export const deleteOrderRequest = async ({ id, token }) => {
  const res = await fetch(`${ORDERS_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Safely parse response body if present
  const data = await res.json().catch(() => ({}));
  return { res, data };
};
