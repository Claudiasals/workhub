import { createRoot } from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import store from "./store/index.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

import "./styles/index.css";
import App from "./App.jsx";

const originalFetch = window.fetch.bind(window);

window.fetch = async (...args) => {
	const response = await originalFetch(...args);
	const requestUrl =
		typeof args[0] === "string" ? args[0] : args[0]?.url || "";

	if (
		response.status === 401 &&
		requestUrl.includes("/api/v1/") &&
		!requestUrl.includes("/auth/login")
	) {
		sessionStorage.removeItem("auth");
		localStorage.removeItem("auth");
		localStorage.removeItem("persist:root");
		window.dispatchEvent(new Event("workhub:unauthorized"));
	}

	return response;
};

createRoot(document.getElementById("root")).render(
	<ReduxProvider store={store}>
		<BrowserRouter>
			<ThemeProvider>
				<LanguageProvider>
					<App />
				</LanguageProvider>
			</ThemeProvider>
		</BrowserRouter>
	</ReduxProvider>
);
