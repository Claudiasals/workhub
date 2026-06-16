import { useEffect } from "react";
import { createPortal } from "react-dom";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const Drawer = ({
  open,
  onClose,
  title,
  children,
  width = "w-[420px]",
  variant = "default",
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isLiquidGlass = variant === "liquid-glass";

  /* Close drawer when ESC key is pressed */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  /* Do not render anything if drawer is closed */
  if (!open) return null;

  const content = (
    <div className="drawer-root">

      {/* Background overlay */}
      <div
        className={`drawer-overlay${
          isLiquidGlass ? " drawer-overlay--liquid-glass" : ""
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`drawer-panel ${width}${
          isLiquidGlass ? " drawer-panel--liquid-glass" : ""
        }`}
        style={
          isLiquidGlass
            ? undefined
            : {
                "--drawer-bg-image": `url(${theme === "dark" ? bgDark : bgLight})`,
              }
        }
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <header className="drawer-header">
          <h2 className="drawer-title">
            {title}
          </h2>

          {/* Close button */}
          <button
            onClick={onClose}
            className="custom-button"
          >
            {t("chiudi")}
          </button>
        </header>

        {/* Drawer content */}
        <div className="drawer-content">
          {children}
        </div>
      </aside>
    </div>
  );

  return createPortal(content, document.body);
};

export default Drawer;
