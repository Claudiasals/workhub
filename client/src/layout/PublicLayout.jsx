import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";

import iconLogo from "../assets/logo/logoVuoto.png";
import iconLogo2 from "../assets/logo/LogoCompletoSenzaBG.png";
import iconChiusa from "../assets/logo/iconaLogo.png";
import iconChiusaDark from "../assets/logo/iconaLogoChiara.png";

import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";

const PublicLayout = () => {
  const { theme } = useTheme();

  const bgImage = theme === "dark" ? bgDark : bgLight;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10 transition-opacity duration-700"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <aside
        className={`
          sidebar-aside
          fixed top-0 left-0 h-full z-40
          transition-all duration-500 ease-in-out
          border-r flex flex-col overflow-hidden py-2
          ${
            theme === "dark"
              ? "sidebar-aside-dark"
              : "bg-linear-to-br from-indigo-950 via-indigo-950/90 to-violet-900 border-white/30 shadow-md backdrop-blur-sm"
          }
          ${sidebarCollapsed ? "sidebar-aside--collapsed" : "sidebar-aside--expanded"}
        `}
      >
        <button
          type="button"
          className="sidebar-logo"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
          aria-expanded={!sidebarCollapsed}
        >
          <img
            src={
              sidebarCollapsed
                ? theme === "dark"
                  ? iconChiusaDark
                  : iconChiusa
                : theme === "dark"
                  ? iconLogo2
                  : iconLogo
            }
            alt="Logo"
            className={`sidebar-logo-img drop-shadow-md transition-all duration-500${
              sidebarCollapsed ? " sidebar-logo-img--compact" : ""
            }`}
          />
        </button>

        <div className="sidebar-nav-area w-full min-h-0">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <section
        data-main-scroll
        className={`
          public-layout-main
          transition-all duration-500 ease-in-out box-border min-w-0
          ${sidebarCollapsed ? "public-layout-main--collapsed" : "public-layout-main--expanded"}
          mt-6 mb-6
          overflow-y-auto
          pr-4 pl-4 md:pr-8 md:pl-8
          z-10
          ${theme === "dark" ? "text-white" : "text-[#090c64]"}
        `}
      >
        <div className="mb-6">
          <Topbar />
        </div>

        <div className="app-page-content">
          <Outlet />
        </div>
      </section>
    </>
  );
};

export default PublicLayout;
