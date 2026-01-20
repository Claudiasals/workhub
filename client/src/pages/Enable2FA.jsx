import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { enable2FAAsync } from "../store/feature/authSlice";
import { useLanguage } from "../context/LanguageContext";

const Enable2FA = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  // 2FA-related redux state
  const { twofaData, twofaLoading, twofaError } = useSelector(
    (state) => state.auth
  );

  // Confirmation modal visibility
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Open confirmation dialog
  const handleEnable = () => {
    setShowConfirmPopup(true);
  };

  // Confirm and trigger 2FA activation
  const confirmEnable = () => {
    setShowConfirmPopup(false);

    const auth = JSON.parse(localStorage.getItem("auth"));
    if (!auth?.token) return;

    dispatch(enable2FAAsync({ token: auth.token }));
  };

  // Close confirmation dialog without action
  const cancelEnable = () => {
    setShowConfirmPopup(false);
  };

  return (
    <div className="p-6 relative">
      <h2 className="text-xl font-bold mb-4">
        {t("abilita2FA")}
      </h2>

      <button
        onClick={handleEnable}
        disabled={twofaLoading}
        className="btn-login"
      >
        {twofaLoading
          ? t("attivazioneInCorso")
          : t("abilita2FA")}
      </button>

      {/* Error feedback */}
      {twofaError && (
        <p className="text-red-500 mt-2">
          {twofaError}
        </p>
      )}

      {/* QR code display */}
      {twofaData && (
        <div className="mt-6">
          <p>{t("scansiona")}</p>
          <img
            src={twofaData.qr}
            alt="2FA QR Code"
            className="mt-4 mx-auto"
          />
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-[300px] text-center">
            <h2 className="text-lg font-bold text-[#090c64] mb-4">
              {t("sicuro2FA")}
            </h2>

            <div className="flex justify-around mt-4">
              <button
                onClick={cancelEnable}
                className="custom-button-light transition-transform duration-200 hover:scale-110"
              >
                No
              </button>

              <button
                onClick={confirmEnable}
                className="custom-button transition-transform duration-200 hover:scale-110"
              >
                Sì
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enable2FA;
