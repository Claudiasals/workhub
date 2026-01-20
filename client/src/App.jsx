import { Routes, Route } from "react-router-dom";

// Layouts
import PublicLayout from "./layout/PublicLayout.jsx";

// Route guards
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage.jsx";
import PasswordRecoveryPage from "./pages/PasswordRecoveryPage.jsx";
import TwoFA from "./pages/TwoFA.jsx";

// Protected pages
import BoardPage from "./pages/BoardPage.jsx";
import CustomersPage from "./pages/Customers/CustomersPage.jsx";
import CustomersRegistry from "./pages/Customers/CustomersRegistry.jsx";
import EmployeePage from "./pages/Employee/EmployeePage.jsx";
import AdminEmployeeDetailsPage from "./pages/Employee/admin/AdminEmployeeDetailsPage.jsx";
import WarehousePage from "./pages/Warehouse/WarehousePage.jsx";
import Product from "./pages/Warehouse/Product.jsx";
import TicketPage from "./pages/Ticketing/TicketPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/twofa" element={<TwoFA />} />
      <Route path="/forgot-password" element={<PasswordRecoveryPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<PublicLayout />}>
          <Route path="board" element={<BoardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customer/:id" element={<CustomersRegistry />} />
          <Route path="personale" element={<EmployeePage />} />
          <Route
            path="personale/:id"
            element={<AdminEmployeeDetailsPage />}
          />
          <Route path="warehouse" element={<WarehousePage />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="ticket" element={<TicketPage />} />
          <Route path="orders" element={<OrderPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
