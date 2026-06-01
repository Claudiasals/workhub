import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { changePasswordAsync } from "../store/feature/authSlice";
import { updateUserAsync } from "../store/feature/userSlice";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

import italianFlag from "../assets/icons/Italy.png";
import englishFlag from "../assets/icons/Great Britain.png";

import { MoonIcon, SunIcon, XIcon } from "@phosphor-icons/react";

import Enable2FA from "./Enable2FA.jsx";

const SETTINGS_RETURN_PATH_KEY = "workhub-settings-return-path";

const SettingsPage = () => {
  const { theme, defaultTheme, setDefaultTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);

  const [username, setUsername] = useState(user?.username || "");
  const [name, setName] = useState(
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
  );
  const [email] = useState(user?.email || "");
  const [role] = useState(user?.role || "");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleExitSettings = () => {
    const returnPath =
      location.state?.returnTo ||
      sessionStorage.getItem(SETTINGS_RETURN_PATH_KEY) ||
      "/board";

    navigate(returnPath, { replace: true });
  };

  const handlePasswordEditToggle = () => {
    setIsEditingPassword((prev) => {
      if (prev) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      return !prev;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    const wantsPasswordChange = Boolean(
      oldPassword || newPassword || confirmPassword
    );
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const profileChanged =
      username !== (user?.username || "") ||
      firstName !== (user?.firstName || "") ||
      lastName !== (user?.lastName || "");
    const userId = user?._id || user?.id;

    if (!profileChanged && !wantsPasswordChange) {
      setMessage(t("nessunaModifica"));
      setMessageType("success");
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);
      return;
    }

    if (profileChanged) {
      if (!email) {
        setMessage("Invalid email in user profile.");
        setMessageType("error");
        return;
      }

      if (!userId) {
        setMessage("Invalid user ID. Please login again.");
        setMessageType("error");
        return;
      }

      try {
        await dispatch(
          updateUserAsync({
            id: userId,
            token,
            updates: {
              username,
              firstName,
              lastName,
              email,
            },
          })
        ).unwrap();
      } catch (err) {
        setMessage(err);
        setMessageType("error");
        return;
      }
    }

    if (wantsPasswordChange) {
      if (!email) {
        setMessage("Invalid email in user profile.");
        setMessageType("error");
        return;
      }

      if (!oldPassword) {
        setMessage(t("inserisciPasswordAttuale"));
        setMessageType("error");
        return;
      }

      if (!newPassword || !confirmPassword) {
        setMessage(t("inserisciNuovaPassword"));
        setMessageType("error");
        return;
      }

      if (newPassword !== confirmPassword) {
        setMessage(t("passwordNonCoincidono"));
        setMessageType("error");
        return;
      }

      try {
        await dispatch(
          changePasswordAsync({
            email,
            oldPassword,
            newPassword,
            token,
          })
        ).unwrap();
      } catch (err) {
        setMessage(err);
        setMessageType("error");
        return;
      }
    }

    setMessage(t("modificheSalvate"));
    setMessageType("success");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsEditing(false);
    setIsEditingPassword(false);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const labelColor = textColor;
  const inputDisabledStyle =
    "cursor-not-allowed bg-gray-200/50 dark:bg-gray-600/20";
  const inputBaseStyle =
    "w-full h-[35px] border rounded-2xl px-4 shadow-md bg-[rgba(217,217,217,0.3)]";

  return (
    <main className="w-full min-h-screen relative transition-colors duration-500">
      <div className="relative z-20 w-full flex flex-col items-stretch gap-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className={`${textColor} text-lg font-bold leading-none`}>
            {t("impostazioni")}
          </h2>

          <button
            type="button"
            onClick={handleExitSettings}
            className="inline-flex w-fit items-center gap-1 bg-transparent p-0 text-lg font-bold text-[#090c64] transition hover:underline dark:text-[#8ea2ff]"
          >
            <XIcon size={12} weight="bold" aria-hidden="true" />
            <span>Chiudi</span>
          </button>
        </div>

        {message && (
          <p
            className={`app-surface w-full px-4 py-3 text-center font-semibold ${
              messageType === "success"
                ? "text-[#090c64]/80 dark:text-white"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full items-start">
          <div className="flex flex-col gap-6">
            <section className="app-surface w-full p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`${textColor} text-lg font-bold`}>
                  {t("modificaPassword")}
                </h2>

                <button
                  type="button"
                  onClick={handlePasswordEditToggle}
                  className="custom-button"
                >
                  {isEditingPassword ? t("annulla") : t("modifica")}
                </button>
              </div>

              <form className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-3">
                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("passwordAttuale")}
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={!isEditingPassword}
                    className={`${inputBaseStyle} ${
                      !isEditingPassword ? inputDisabledStyle : ""
                    }`}
                  />
                </div>

                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("nuovaPassword")}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!isEditingPassword}
                    className={`${inputBaseStyle} ${
                      !isEditingPassword ? inputDisabledStyle : ""
                    }`}
                  />
                </div>

                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("confermaPassword")}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!isEditingPassword}
                    className={`${inputBaseStyle} ${
                      !isEditingPassword ? inputDisabledStyle : ""
                    }`}
                  />
                </div>
              </form>
            </section>

            <section className="app-surface w-full p-5">
              <Enable2FA
                compact
                title={t("autenticazione2FA")}
                titleClassName={`${textColor} text-lg font-bold`}
              />
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="app-surface w-full p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`${textColor} text-lg font-bold`}>
                  {t("anagraficaUtente")}
                </h2>

                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="custom-button"
                >
                  {isEditing ? t("annulla") : t("modifica")}
                </button>
              </div>

              <form className="flex flex-col gap-3">
                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("username")}
                  </label>
                  <input
                    type="text"
                    value={username}
                    disabled={!isEditing}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`${inputBaseStyle} ${
                      !isEditing ? inputDisabledStyle : ""
                    }`}
                  />
                </div>

                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("nomeCompleto")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    disabled={!isEditing}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputBaseStyle} ${
                      !isEditing ? inputDisabledStyle : ""
                    }`}
                  />
                </div>

                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full h-[35px] border rounded-2xl px-4 shadow-md bg-gray-300/50 dark:bg-gray-600/30 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className={`${labelColor} text-[14px] font-bold block mb-1.5`}>
                    {t("role")}
                  </label>
                  <input
                    type="text"
                    value={role}
                    disabled
                    className="w-full h-[35px] border rounded-2xl px-4 shadow-md bg-gray-300/50 dark:bg-gray-600/30 cursor-not-allowed"
                  />
                </div>
              </form>
            </section>

            <section className="app-surface w-full p-5 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={`${textColor} text-lg font-bold`}>
                  {t("lingua")}
                </h2>

                <div className="inline-flex h-[38px] rounded-full border border-white/35 bg-white/20 p-1 shadow-sm dark:bg-white/10">
                  <button
                    type="button"
                    onClick={() => toggleLang("it")}
                    className={`flex h-full items-center gap-2 rounded-full px-3 text-sm font-bold transition-colors duration-300 ${
                      lang === "it"
                        ? "bg-white text-[#090c64] shadow-md"
                        : "text-[#090c64] hover:bg-white/30 dark:text-[#8ea2ff] dark:hover:bg-white/15 dark:hover:text-[#8ea2ff]"
                    }`}
                  >
                    <img src={italianFlag} alt="Italiano" className="w-5 h-5" />
                    IT
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleLang("en")}
                    className={`flex h-full items-center gap-2 rounded-full px-3 text-sm font-bold transition-colors duration-300 ${
                      lang === "en"
                        ? "bg-white text-[#090c64] shadow-md"
                        : "text-[#090c64] hover:bg-white/30 dark:text-[#8ea2ff] dark:hover:bg-white/15 dark:hover:text-[#8ea2ff]"
                    }`}
                  >
                    <img src={englishFlag} alt="English" className="w-5 h-5" />
                    EN
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={`${textColor} text-lg font-bold`}>
                  {t("temaPredefinito")}
                </h2>

                <div className="inline-flex h-[38px] rounded-full border border-white/35 bg-white/20 p-1 shadow-sm dark:bg-white/10">
                  <button
                    type="button"
                    onClick={() => setDefaultTheme("light")}
                    aria-label={t("chiaro")}
                    title={t("chiaro")}
                    className={`flex h-full w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                      defaultTheme === "light"
                        ? "bg-white shadow-md"
                        : "hover:bg-white/30 dark:hover:bg-white/15"
                    }`}
                  >
                    <SunIcon
                      size={20}
                      weight="duotone"
                      color={
                        defaultTheme === "light" ? "#090c64" : theme === "dark" ? "#8ea2ff" : "#090c64"
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultTheme("dark")}
                    aria-label={t("scuro")}
                    title={t("scuro")}
                    className={`flex h-full w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                      defaultTheme === "dark"
                        ? "bg-white shadow-md"
                        : "hover:bg-white/30 dark:hover:bg-white/15"
                    }`}
                  >
                    <MoonIcon
                      size={20}
                      weight="duotone"
                      color={
                        defaultTheme === "dark" ? "#090c64" : theme === "dark" ? "#8ea2ff" : "#090c64"
                      }
                    />
                  </button>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                onClick={handleSave}
                className="custom-button px-4 w-fit"
              >
                {t("salvaModifiche")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
