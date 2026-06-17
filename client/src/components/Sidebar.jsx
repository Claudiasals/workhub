import { NavLink, useLocation } from "react-router-dom";
import {
  PackageIcon,
  ShoppingCartIcon,
  SquaresFourIcon,
  TicketIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useSelector } from "react-redux";

const Sidebar = ({ collapsed = false }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const role = useSelector((state) => state.auth.user?.role);
  const isUser = role === "user";

  const location = useLocation();
  const modeClass = theme === "dark" ? "dark" : "light";

  const routes = [
    { to: "board", label: t("overview"), icon: SquaresFourIcon },
    { to: "customers", label: t("clienti"), icon: UsersThreeIcon },
    { to: "warehouse", label: t("magazzino"), icon: PackageIcon },
    { to: "orders", label: t("ordiniSidebar"), icon: ShoppingCartIcon },
    { to: "ticket", label: t("ticket"), icon: TicketIcon },
    {
      to: "personale",
      label: isUser ? t("profilo") : t("personale"),
      icon: UserCircleIcon,
    },
  ];

  const isRouteActive = (itemTo) => {
    const path = location.pathname;

    if (itemTo === "customers") {
      return path.startsWith("/customers") || path.startsWith("/customer");
    }

    if (itemTo === "personale") {
      return path.startsWith("/personale");
    }

    if (itemTo === "warehouse") {
      return path.startsWith("/warehouse") || path.startsWith("/product");
    }

    return path === `/${itemTo}`;
  };

  return (
    <nav
      className={`sidebar-nav w-full transition-all duration-300${
        collapsed ? " sidebar-nav--collapsed" : ""
      }`}
    >
      {routes.map((item) => {
        const active = isRouteActive(item.to);
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={`/${item.to}`}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={`sidebar-link ${modeClass}${active ? " active" : ""}${
              collapsed ? " sidebar-link--collapsed" : ""
            }`}
          >
            {collapsed ? (
              <Icon
                size={44}
                weight="duotone"
                className="sidebar-link-icon shrink-0"
                aria-hidden="true"
              />
            ) : (
              <span className="sidebar-link-label">{item.label}</span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Sidebar;
