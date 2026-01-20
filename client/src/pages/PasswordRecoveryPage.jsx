import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SunIcon, MoonIcon } from "@phosphor-icons/react";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { recoverPasswordAsync } from "../store/feature/authSlice";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";

const PasswordRecoveryPage = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();

  // Password recovery state from redux
  const { recoveryLoading, recoveryError, recoveryMessage } = useSelector(
    (state) => state.auth
  );

  // Local form state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // Theme-based UI values
  const backgroundImage = theme === "dark" ? bgDark : bgLight;
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  // Submits password recovery request
  const handleRecovery = (e) => {
    e.preventDefault();
    dispatch(recoverPasswordAsync({ email, username }));
  };

  // Logs temporary password for development purposes
  useEffect(() => {
    if (recoveryMessage?.tempPassword) {
      console.log("TEMP PASSWORD:", recoveryMessage.tempPassword);
    }
  }, [recoveryMessage]);

  return (
    <main className="w-full min-h-screen flex justify-center items-center relative overflow-hidden transition-colors duration-500">
      <img
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={backgroundImage}
        alt="Background"
      />

      <div className="relative z-20 w-full sm:w-[480px] flex flex-col items-center px-6 py-10 space-y-8">
        <div className="flex items-center justify-between w-full mb-6">
          <h1 className={`text-3xl font-bold uppercase ${textColor}`}>
            {t("recuperaPassword")}
          </h1>

          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="p-2 rounded-xl border border-white/30 hover:bg-[#1C62A0]/10"
          >
            {theme === "dark" ? (
              <MoonIcon size={30} color="white" weight="duotone" />
            ) : (
              <SunIcon size={30} color="#090c64" weight="duotone" />
            )}
          </button>
        </div>

        <section className="w-full p-6 rounded-[25px] shadow-md border border-white/90 bg-white/10 backdrop-blur-sm">
          <h2
            className={`${textColor} text-xl font-bold mb-4 pb-2 border-b`}
          >
            {t("inserisciDati")}
          </h2>

          {recoveryError && (
            <p className="text-red-500 font-bold text-center mb-4">
              {recoveryError}
            </p>
          )}

          {recoveryMessage && (
            <p className="text-green-500 font-bold text-center mb-4">
              {t("emailInviata")} {recoveryMessage.email}
            </p>
          )}

          <form onSubmit={handleRecovery} className="flex flex-col gap-5">
            <div>
              <label
                className={`${textColor} text-[18px] font-bold mb-2`}
              >
                {t("username")}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("inserisciUsername")}
                className="w-full h-[35px] bg-[rgba(217,217,217,0.3)] border border-white/30 rounded-2xl px-4 shadow-md"
              />
            </div>

            <div>
              <label
                className={`${textColor} text-[18px] font-bold mb-2`}
              >
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("inserisciEmail")}
                className="w-full h-[35px] bg-[rgba(217,217,217,0.3)] border border-white/30 rounded-2xl px-4 shadow-md"
              />
            </div>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="w-full mt-4 py-3 font-bold rounded-2xl shadow-md bg-[#090c64] text-white transition custom-button hover:scale-[1.02]"
            >
              {recoveryLoading
                ? t("invioInCorso")
                : t("inviaRichiesta")}
            </button>

            <Link
              to="/login"
              className={`text-center mt-3 ${textColor} font-semibold hover:underline`}
            >
              {t("tornaLogin")}
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
};

export default PasswordRecoveryPage;
