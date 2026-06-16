import {
  UserIcon,
  SunIcon,
  MoonIcon,
  GearIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/feature/authSlice";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import NotificationBell from "./NotificationBell";

const SETTINGS_RETURN_PATH_KEY = "workhub-settings-return-path";

const TopBar = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  // Toggles between light and dark theme
  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Logs out user and redirects to login page
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleSettingsClick = () => {
    if (location.pathname === "/settings") {
      const returnPath =
        sessionStorage.getItem(SETTINGS_RETURN_PATH_KEY) || "/board";
      navigate(returnPath, { replace: true });
      return;
    }

    const returnPath = `${location.pathname}${location.search}${location.hash}`;
    sessionStorage.setItem(SETTINGS_RETURN_PATH_KEY, returnPath);
    navigate("/settings", { state: { returnTo: returnPath } });
  };

  return (
    <header
      className={`
        topbar
        ${theme === "dark" ? "topbar-dark" : "topbar-light"}
      `}
    >
      <div className="topbar-left">
        <UserIcon
          size={24}
          weight="duotone"
          color={theme === "dark" ? "white" : "#090c64"}
          cursor="pointer"
        />

        <span className="topbar-username">
          {t("benvenuto")} {user?.firstName || "Guest"}{" "}
          {user?.lastName || ""}
        </span>
      </div>

      <div className="topbar-actions">
        <NotificationBell />

        <button
          type="button"
          onClick={handleSettingsClick}
          title={t("impostazioni")}
          aria-label={t("impostazioni")}
        >
          <GearIcon
            size={24}
            weight="duotone"
            color={theme === "dark" ? "white" : "#090c64"}
          />
        </button>

        <button
          onClick={handleThemeToggle}
          title={theme === "dark" ? "Passa alla modalita light" : "Passa alla modalita dark"}
          aria-label={theme === "dark" ? "Passa alla modalita light" : "Passa alla modalita dark"}
        >
          {theme === "dark" ? (
            <SunIcon size={24} color="white" weight="duotone" />
          ) : (
            <MoonIcon size={24} color="#090c64" weight="duotone" />
          )}
        </button>

        <button onClick={handleLogout} title="Logout">
          <SignOutIcon
            size={24}
            weight="duotone"
            color={theme === "dark" ? "white" : "#090c64"}
            cursor="pointer"
          />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
