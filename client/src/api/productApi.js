import { API_URL } from "../config/api";

// Fetch all products (GET)
export const fetchProductsRequest = async (token) => {
  const res = await fetch(`${API_URL}/products`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};

// Fetch product by ID (GET)
export const fetchProductByIdRequest = async (id, token) => {
  const res = await fetch(`${API_URL}/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return { res, data };
};
