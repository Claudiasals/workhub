import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useSelector } from "react-redux";

const Sidebar = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Current user role
  const role = useSelector((state) => state.auth.user?.role);
  const isUser = role === "user";

  const location = useLocation();

  // Sidebar navigation routes
  const routes = [
    { to: "board", label: t("overview") },
    { to: "customers", label: t("clienti") },
    { to: "warehouse", label: t("magazzino") },
    { to: "orders", label: t("ordiniSidebar") },
    { to: "ticket", label: t("ticket") },
    {
      to: "personale",
      label: isUser ? t("profilo") : t("personale"),
    },
  ];

  // Determines whether a route should be marked as active
  const isRouteActive = (itemTo) => {
    const path = location.pathname;

    if (itemTo === "customers") {
      return path.startsWith("/customers") || path.startsWith("/customer");
    }

    if (itemTo === "personale") {
      return path.startsWith("/personale");
    }

    if (itemTo === "warehouse") {
      return (
        path.startsWith("/warehouse") || path.startsWith("/product")
      );
    }

    return path === `/${itemTo}`;
  };

  return (
    <nav className="sidebar-nav w-full transition-all duration-300">
      {routes.map((item) => {
        const active = isRouteActive(item.to);

        return (
          <NavLink
            key={item.to}
            to={`/${item.to}`}
            className={`
              relative flex items-center justify-center text-center font-bold text-[16px] 
              tracking-wide py-1 rounded-xl mx-2 select-none
              border-2 border-transparent transition-transform duration-200 ease-out
              ${
                active
                  ? theme === "dark"
                    ? "bg-white/10 border-white/80 text-white scale-105 shadow-md"
                    : "border-violet-500/60 bg-white scale-105 text-[#090c64]"
                  : theme === "dark"
                  ? "text-white/80 hover:bg-white/10 hover:scale-[1.04]"
                  : "text-white hover:scale-[1.04]"
              }
            `}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Sidebar;
