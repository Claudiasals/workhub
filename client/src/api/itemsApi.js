import { API_URL } from "../config/api.js";

// Fetch all warehouse items (GET)
export async function fetchItems(tokenFromState) {
  // Prefer the Redux token, fall back to the current browser session.
  const token =
    tokenFromState || JSON.parse(sessionStorage.getItem("auth"))?.token;

  const response = await fetch(`${API_URL}/items`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      data.message ||
      (response.status === 401
        ? "Sessione scaduta o accesso non autorizzato. Effettua di nuovo il login."
        : "Errore nel caricamento del magazzino.");

    throw new Error(message);
  }

  return response.json();
}
