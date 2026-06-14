import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { loginAsync, setLoginData } from "../store/feature/authSlice";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";
import logoFull from "../assets/logo/LogoCompletoSenzaBG.png";

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
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Theme-based assets and styles
  const isDark = theme === "dark";
  const backgroundImage = isDark ? bgDark : bgLight;
  const textColor = isDark ? "text-white" : "text-[#090c64]";
  const demoTextColor = isDark ? "text-[#8ea2ff]/80" : "text-[#090c64]/75";

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

      {/* Login card */}
      <div
        className="
          app-surface
          relative z-20 w-[460px] max-w-[calc(100vw-32px)]
          px-8 py-8 sm:px-10
          flex items-center justify-center
          transition-all duration-700
        "
      >
        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[380px] flex flex-col items-center"
        >
          {/* Logo and title */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/login">
              <img
                src={logoFull}
                alt="Logo"
                className="w-[210px] h-auto object-contain drop-shadow-lg"
              />
            </Link>

            <div className="text-center">
              <span
                className={`text-2xl font-bold font-nunito uppercase transition-colors duration-500 ${textColor}`}
              >
                {t("loginTitolo")}
              </span>
              <br />
              <span
                className={`text-sm font-normal font-nunito leading-snug transition-colors duration-500 ${demoTextColor}`}
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
          <div className="mb-4 w-full">
            <label
              htmlFor="username"
              className={`block text-[15px] font-bold font-nunito mb-2 ${textColor}`}
            >
              {t("username")}
            </label>

            <input
              ref={usernameRef}
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  passwordRef.current?.focus();
                }
              }}
              className="custom-input w-full"
            />
          </div>

          {/* Password input */}
          <div className="relative mb-2 w-full">
            <label
              htmlFor="password"
              className={`block text-[15px] font-bold font-nunito mb-2 ${textColor}`}
            >
              {t("password")}
            </label>

            <input
              ref={passwordRef}
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
              aria-label={
                showPassword ? "Nascondi password" : "Mostra password"
              }
              title={showPassword ? "Nascondi password" : "Mostra password"}
              className="absolute top-[43px] right-3 -translate-y-1/2
              w-[30px] h-[30px] flex items-center justify-center cursor-pointer"
            >
              {showPassword ? (
                <EyeSlashIcon
                  size={24}
                  color={isDark ? "#fff" : "#090c64"}
                  weight="duotone"
                />
              ) : (
                <EyeIcon
                  size={24}
                  color={isDark ? "#fff" : "#090c64"}
                  weight="duotone"
                />
              )}
            </button>
          </div>

          {/* Password recovery link */}
          <div className="w-full flex justify-center">
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
      </div>
    </main>
  );
};

export default LoginPage;
