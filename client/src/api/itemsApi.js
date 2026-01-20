import { API_URL } from "../config/api.js";

// Fetch all warehouse items (GET)
export async function fetchItems() {
  // Retrieve JWT token from localStorage
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  const response = await fetch(`${API_URL}/items`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch items");
  }

  return response.json();
}
