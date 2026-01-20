import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { loginAsync, setLoginData } from "../store/feature/authSlice";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";
import logoLight from "../assets/logo/iconaLogo.png";
import logoDark from "../assets/logo/iconaLogoChiara.png";

const LoginPage = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Auth state from redux
  const { user, token, is2FARequired, loading, error } = useSelector(
    (state) => state.auth
  );

  // Local form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Theme-based assets and styles
  const isDark = theme === "dark";
  const backgroundImage = isDark ? bgDark : bgLight;
  const logo = isDark ? logoDark : logoLight;
  const textColor = isDark ? "text-white" : "text-[#090c64]";

  // Submit login credentials
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    dispatch(loginAsync({ username, password, code: null }));
  };

  // Handle authentication flow and redirects
  useEffect(() => {
    if (token && user && !is2FARequired) {
      navigate("/board");
      return;
    }

    if (is2FARequired) {
      dispatch(setLoginData({ username, password }));
      navigate("/twofa");
    }
  }, [
    token,
    user,
    is2FARequired,
    navigate,
    dispatch,
    username,
    password,
  ]);

  return (
    <main
      className="w-full min-h-screen flex justify-center items-center relative overflow-hidden
      bg-white dark:bg-black transition-colors duration-500"
    >
      {/* Background image */}
      <img
        src={backgroundImage}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700"
      />

      {/* Glass overlay */}
      <div
        className="
          absolute w-[822px] h-[659px]
          lg:w-[60vw] lg:h-[90vh]
          md:w-[90vw] md:h-[70vh]
          bg-white/20 dark:bg-white/10 backdrop-blur-sm
          border border-white/30 dark:border-white/90
          rounded-[25px] shadow-md
          transition-all duration-700
        "
      />

      {/* Login form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-20 w-full max-w-[822px] px-6 py-10
        flex flex-col items-center"
      >
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <Link to="/">
            <img
              src={logo}
              alt="Logo"
              className="w-[120px] h-[114px] drop-shadow-lg
              transition-transform duration-300 hover:scale-105"
            />
          </Link>

          <div className="text-center">
            <span
              className={`text-4xl font-bold font-nunito uppercase transition-colors duration-500 ${textColor}`}
            >
              {t("loginTitolo")}
            </span>
            <br />
            <span
              className={`text-sm font-bold font-nunito transition-colors duration-500 ${textColor}`}
            >
              {t("credenzialiDemo")}
            </span>
          </div>
        </div>

        {/* Error feedback */}
        {error && (
          <p className="text-[#DC2626] font-bold mt-3 mb-2 animate-pulse text-center">
            {error}
          </p>
        )}

        {/* Username input */}
        <div className="m-4 w-full sm:w-[486px]">
          <label
            htmlFor="username"
            className={`block text-[18px] font-bold font-nunito mb-2 ${textColor}`}
          >
            {t("username")}
          </label>

          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="custom-input w-full"
          />
        </div>

        {/* Password input */}
        <div className="relative m-2 w-full sm:w-[486px]">
          <label
            htmlFor="password"
            className={`block text-[18px] font-bold font-nunito mb-2 ${textColor}`}
          >
            {t("password")}
          </label>

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="custom-input w-full"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-[75%] right-4 -translate-y-1/2
            w-[30px] h-[30px] flex items-center justify-center cursor-pointer"
          >
            {showPassword ? (
              <EyeIcon
                size={24}
                color={isDark ? "#fff" : "#090c64"}
                weight="duotone"
              />
            ) : (
              <EyeSlashIcon
                size={24}
                color={isDark ? "#fff" : "#090c64"}
                weight="duotone"
              />
            )}
          </button>
        </div>

        {/* Password recovery link */}
        <div className="w-[63%] flex justify-end">
          <Link
            to="/forgot-password"
            className={`text-[14px] font-bold font-nunito transition ${textColor}`}
          >
            {t("dimenticatoPassword")}
          </Link>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`btn-login ${loading ? "btn-login-disabled" : ""}`}
        >
          {loading ? (
            <span className="animate-pulse font-bold text-[18px] font-nunito">
              {t("accessoInCorso")}
            </span>
          ) : (
            <span className="text-[20px] font-bold font-nunito">
              {t("login")}
            </span>
          )}
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
