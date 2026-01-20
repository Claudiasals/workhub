import {
  UserIcon,
  SunIcon,
  MoonIcon,
  GearIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/feature/authSlice";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const TopBar = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  return (
    <header
      className={`
        topbar
        ${theme === "dark" ? "topbar-dark" : "topbar-light"}
      `}
    >
      <div className="topbar-left">
        <UserIcon
          size={28}
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
        <button onClick={handleThemeToggle}>
          {theme === "dark" ? (
            <MoonIcon size={26} color="white" weight="duotone" />
          ) : (
            <SunIcon size={26} color="#090c64" weight="duotone" />
          )}
        </button>

        <Link to="/settings">
          <GearIcon
            size={26}
            weight="duotone"
            color={theme === "dark" ? "white" : "#090c64"}
          />
        </Link>

        <button onClick={handleLogout} title="Logout">
          <SignOutIcon
            size={26}
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
