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
import iconLogo from "../assets/logo/iconaLogo.png";
import iconLogoDark from "../assets/logo/iconaLogoChiara.png";

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
  const backgroundImage = theme === "dark" ? bgDark : bgLight;
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

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
        className="absolute w-[822px] h-[659px] lg:w-[60vw] lg:h-[90vh] md:w-[90vw] md:h-[70vh]  
        bg-white/20 dark:bg-white/10 backdrop-blur-sm
        border border-white/30 dark:border-white/90 rounded-[25px] shadow-md
        transition-all duration-700"
      />

      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col items-center z-20 w-full max-w-[822px] px-6 py-10"
      >
        <div className="flex items-center justify-center gap-8 mb-8">
          <Link to="/">
            <img
              className="w-[120px] h-[114px] drop-shadow-lg transition-transform duration-300 hover:scale-105"
              alt="Logo"
              src={theme === "dark" ? iconLogoDark : iconLogo}
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
              className={`font-bold font-nunito text-sm transition-colors duration-500 ${textColor}`}
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

        <div className="m-4 w-full sm:w-[486px]">
          <label
            htmlFor="token2fa"
            className={`block text-[18px] font-bold font-nunito mb-2 ${textColor}`}
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
    </main>
  );
};

export default TwoFA;
