import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { updateUserAsync } from "../store/feature/userSlice";
import { changePasswordAsync } from "../store/feature/authSlice";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import italianFlag from "../assets/icons/Italy.png";
import englishFlag from "../assets/icons/Great Britain.png";

import {
  EyeIcon,
  EyeSlashIcon,
  SunIcon,
  MoonIcon,
} from "@phosphor-icons/react";

import Enable2FA from "./Enable2FA.jsx";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const dispatch = useDispatch();

  const { user, token } = useSelector((state) => state.auth);

  // User profile state
  const [username, setUsername] = useState(user?.username || "");
  const [name, setName] = useState(
    `${user?.firstName || ""} ${user?.lastName || ""}`
  );

  // Read-only fields
  const [email] = useState(user?.email || "");
  const [role] = useState(user?.role || "");

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit mode toggles
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  // Feedback messages
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Saves profile and account changes
  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Invalid email in user profile.");
      setMessageType("error");
      return;
    }

    const [firstName, lastName] = name.trim().split(" ");
    const userId = user?._id || user?.id;

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
            firstName: firstName || "",
            lastName: lastName || "",
            email,
          },
        })
      ).unwrap();
    } catch (err) {
      setMessage(err);
      setMessageType("error");
      return;
    }

    if (newPassword || confirmPassword || oldPassword) {
      if (!oldPassword) {
        setMessage(t("settingsinserisciPasswordAttuale"));
        setMessageType("error");
        return;
      }

      if (!newPassword || !confirmPassword) {
        setMessage("Please enter and confirm the new password.");
        setMessageType("error");
        return;
      }

      if (newPassword !== confirmPassword) {
        setMessage(t("settings.passwordNonCoincidono"));
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
    setIsEditingAccount(false);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const labelColor = textColor;
  const inputDisabledStyle =
    "cursor-not-allowed bg-gray-200/50 dark:bg-gray-600/20";

  return (
    <main className="w-full min-h-screen flex justify-center items-center relative overflow-hidden transition-colors duration-500">
      <div className="relative z-20 w-full flex flex-col items-center px-6 py-8 space-y-10">
        <div className="flex items-center gap-2">
          <h1 className={`text-3xl font-bold uppercase ${textColor}`}>
            {t("impostazioni")}
          </h1>
        </div>

        <section className="w-full p-6 rounded-[25px] shadow-md border border-white/30 bg-[#fafafa20] dark:bg-[#fafafa30] backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className={`${textColor} text-xl font-bold`}>
              {t("anagraficaUtente")}
            </h2>

            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="px-4 py-1 rounded-xl text-[14px] font-semibold border border-white text-white bg-[#090c64] hover:bg-[#090c64]/80 custom-button"
            >
              {isEditing ? t("annulla") : t("modifica")}
            </button>
          </div>

          {message && (
            <p
              className={`${
                messageType === "success"
                  ? "text-[#090c64]/80"
                  : "text-red-500"
              } text-center font-bold mb-4`}
            >
              {message}
            </p>
          )}

          <form className="flex flex-col gap-4">
            <div>
              <label className={`${labelColor} text-[18px] font-bold mb-2`}>
                {t("username")}
              </label>
              <input
                type="text"
                value={username}
                disabled={!isEditing}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full h-[35px] border rounded-2xl px-4 shadow-md bg-[rgba(217,217,217,0.3)]
                ${!isEditing ? inputDisabledStyle : ""}`}
              />
            </div>

            <div>
              <label className={`${labelColor} text-[18px] font-bold mb-2`}>
                {t("nomeCompleto")}
              </label>
              <input
                type="text"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
                className={`w-full h-[35px] border rounded-2xl px-4 shadow-md bg-[rgba(217,217,217,0.3)]
                ${!isEditing ? inputDisabledStyle : ""}`}
              />
            </div>

            <div>
              <label className={`${labelColor} text-[18px] font-bold mb-2`}>
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
              <label className={`${labelColor} text-[18px] font-bold mb-2`}>
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

        <section className="w-full p-6 rounded-[25px] shadow-md border border-white/30 bg-[#fafafa20] dark:bg-[#fafafa30] backdrop-blur-sm">
          <h2 className={`${textColor} text-xl font-bold mb-4 border-b pb-2`}>
            {t("autenticazione2FA")}
          </h2>

          <Enable2FA />
        </section>

        <section className="w-full p-6 rounded-[25px] shadow-md border border-white/30 bg-[#fafafa20] dark:bg-[#fafafa30] backdrop-blur-sm">
          <h2 className={`${textColor} text-xl font-bold mb-4 border-b pb-2`}>
            {t("aspetto")}
          </h2>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col gap-2 w-full sm:w-1/2">
              <span className={`${labelColor} font-semibold mb-1`}>
                {t("tema")}
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-300 ${
                    theme === "light"
                      ? "border-[#090c64] bg-[rgba(217,217,217,0.3)]"
                      : "border-gray-300 dark:border-white/30"
                  }`}
                >
                  <SunIcon
                    size={28}
                    color={theme === "light" ? "#090c64" : "white"}
                    weight="duotone"
                  />
                  Light
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-[#090c64] bg-[rgba(217,217,217,0.3)]"
                      : "border-gray-300 dark:border-white/30"
                  }`}
                >
                  <MoonIcon
                    size={28}
                    color={theme === "light" ? "#090c64" : "white"}
                    weight="duotone"
                  />
                  Dark
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-1/2">
              <span className={`${labelColor} font-semibold mb-1`}>
                {t("lingua")}
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleLang("it")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-300 ${
                    lang === "it"
                      ? "border-[#090c64] bg-[rgba(217,217,217,0.3)]"
                      : "border-gray-300 dark:border-white/30"
                  }`}
                >
                  <img src={italianFlag} alt="Italiano" className="w-6 h-6" />
                  {t("italiano")}
                </button>

                <button
                  type="button"
                  onClick={() => toggleLang("en")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-300 ${
                    lang === "en"
                      ? "border-[#090c64] bg-[rgba(217,217,217,0.3)]"
                      : "border-gray-300 dark:border-white/30"
                  }`}
                >
                  <img src={englishFlag} alt="English" className="w-6 h-6" />
                  {t("inglese")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full flex flex-col sm:flex-row justify-center gap-6 mt-2">
          <button
            type="submit"
            onClick={handleSave}
            className="w-full sm:w-[200px] py-3 font-bold rounded-2xl shadow-md border bg-[#090c64] text-white hover:bg-[#090c64]/80 custom-button"
          >
            {t("salvaModifiche")}
          </button>

          <Link
            to="/login"
            className="w-full sm:w-[200px] py-3 text-center font-bold rounded-2xl shadow-md border bg-[#090c64] text-white hover:bg-[#090c64]/80 custom-button"
          >
            {t("esci")}
          </Link>
        </section>
      </div>
    </main>
  );
};

export default SettingsPage;
