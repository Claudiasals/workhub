import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginAsync,
  setIs2FARequired,
  setLoginData,
} from "../store/feature/authSlice";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";
import logoFull from "../assets/logo/LogoCompletoSenzaBG.png";

const TwoFA = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Authentication state with temporary login credentials
  const {
    user,
    token,
    loading,
    error,
    loginData: { username, password },
  } = useSelector((state) => state.auth);

  // 2FA code input state
  const [code, setCode] = useState("");

  // Theme-based UI values
  const isDark = theme === "dark";
  const backgroundImage = isDark ? bgDark : bgLight;
  const textColor = isDark ? "text-white" : "text-[#090c64]";
  const demoTextColor = isDark ? "text-[#8ea2ff]/80" : "text-[#090c64]/75";

  // Handles 2FA form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) {
      navigate("/login");
      return;
    }

    dispatch(loginAsync({ username, password, code }));
    dispatch(setLoginData({ username: null, password: null }));
    dispatch(setIs2FARequired(false));
  };

  // Redirects user after successful authentication
  useEffect(() => {
    if (token && user) {
      navigate("/board");
    }
  }, [token, user, navigate]);

  return (
    <main
      className="w-full min-h-screen flex justify-center items-center relative overflow-hidden 
      bg-white dark:bg-black transition-colors duration-500"
    >
      <img
        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700"
        alt="Background"
        src={backgroundImage}
      />

      <div
        className="
          app-surface
          relative z-20 w-[460px] max-w-[calc(100vw-32px)]
          px-8 py-8 sm:px-10
          flex items-center justify-center
          transition-all duration-700
        "
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[380px] flex flex-col items-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/login">
              <img
                className="w-[210px] h-auto object-contain drop-shadow-lg"
                alt="Logo"
                src={logoFull}
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

          {error && (
            <p className="text-[#DC2626] font-bold mt-3 mb-2 animate-pulse text-center">
              {error}
            </p>
          )}

          <div className="mb-4 w-full">
            <label
              htmlFor="token2fa"
              className={`block text-[15px] font-bold font-nunito mb-2 ${textColor}`}
            >
              {t("autenticazione2FA")}
            </label>

            <input
              id="token2fa"
              type="text"
              autoComplete="one-time-code"
              className="custom-input w-full"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("inserisciCodice2FA")}
            />
            <p
              className={`mt-2 text-sm font-normal leading-snug transition-colors duration-500 ${demoTextColor}`}
            >
              {t("codiceDemo2FA")}
            </p>
          </div>

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

export default TwoFA;
