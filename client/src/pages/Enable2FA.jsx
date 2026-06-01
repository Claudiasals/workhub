import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { enable2FAAsync } from "../store/feature/authSlice";
import { useLanguage } from "../context/LanguageContext";

const Enable2FA = ({ compact = false, title = null, titleClassName = "" }) => {
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

    const auth = JSON.parse(sessionStorage.getItem("auth"));
    if (!auth?.token) return;

    dispatch(enable2FAAsync({ token: auth.token }));
  };

  // Close confirmation dialog without action
  const cancelEnable = () => {
    setShowConfirmPopup(false);
  };

  const enableButton = (
    <button
      type="button"
      onClick={handleEnable}
      disabled={twofaLoading}
      className={
        compact ? `custom-button w-fit ${title ? "" : "self-end"}` : "btn-login"
      }
    >
      {twofaLoading
        ? t("attivazioneInCorso")
        : t("abilita2FA")}
    </button>
  );

  return (
    <div className={compact ? "relative flex flex-col gap-3" : "p-6 relative"}>
      {!compact && (
        <h2 className="text-xl font-bold mb-4">
          {t("abilita2FA")}
        </h2>
      )}

      {compact && title ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={titleClassName}>{title}</h3>
          {enableButton}
        </div>
      ) : null}

      {compact && (
        <p className="text-sm opacity-75">
          Aggiunge un controllo extra all'accesso, utile per proteggere l'account.
        </p>
      )}

      {(!compact || !title) && enableButton}

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
        <div className="app-modal-backdrop fixed inset-0 flex items-center justify-center z-50">
          <div className="app-modal-panel p-6 w-[300px] text-center">
            <h2 className="text-lg font-bold mb-4">
              {t("sicuro2FA")}
            </h2>

            <div className="flex justify-around mt-4">
              <button
                type="button"
                onClick={cancelEnable}
                className="custom-button-light transition-transform duration-200 hover:scale-110"
              >
                No
              </button>

              <button
                type="button"
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
