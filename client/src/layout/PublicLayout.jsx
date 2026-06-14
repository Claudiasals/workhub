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

  // Background image based on theme
  const bgImage = theme === "dark" ? bgDark : bgLight;

  // Sidebar open / close state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      {/* Background layer */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10 transition-opacity duration-700"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Sidebar */}
      {sidebarOpen && (
        <aside
          className={`
            sidebar-aside
            fixed top-0 left-0 h-full z-40
            transition-all duration-700 ease-in-out
            border-r flex flex-col overflow-hidden w-[190px] md:w-[210px] py-2 px-4
            ${
              theme === "dark"
                ? "sidebar-aside-dark"
                : "bg-linear-to-br from-indigo-950 via-indigo-950/90 to-violet-900 border-white/30 shadow-md backdrop-blur-sm"
            }
          `}
        >
          {/* Sidebar logo (click to close) */}
          <div
            className="sidebar-logo flex flex-shrink-0 flex-col items-center gap-2 cursor-pointer -mt-4 mb-1 pt-0 translate-y-[5px]"
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src={theme === "dark" ? iconLogo2 : iconLogo}
              alt="Logo"
              className="sidebar-logo-img w-40 md:w-48 h-auto object-contain drop-shadow-md transition-all duration-700"
            />
          </div>

          <div className="sidebar-nav-area w-full min-h-0">
            <Sidebar />
          </div>
        </aside>
      )}

      {/* Floating logo when sidebar is closed */}
      {!sidebarOpen && (
        <div
          className="fixed top-6 left-6 z-50 cursor-pointer
            transition-transform duration-500 hover:scale-105
            border border-white/90 backdrop-blur-sm
            rounded-full bg-white/10 shadow-md"
          onClick={() => setSidebarOpen(true)}
        >
          <img
            src={theme === "dark" ? iconChiusaDark : iconChiusa}
            alt="Logo"
            className="w-12 md:w-14 h-auto object-contain drop-shadow-lg"
          />
        </div>
      )}

      {/* Main content area — width must account for sidebar margin, not 100% + margin */}
      <section
        data-main-scroll
        className={`
          transition-all duration-500 ease-in-out box-border min-w-0
          ${
            sidebarOpen
              ? "ml-[190px] md:ml-[210px] w-[calc(100%-190px)] md:w-[calc(100%-210px)]"
              : "ml-20 md:ml-[90px] w-[calc(100%-5rem)] md:w-[calc(100%-90px)]"
          }
          mt-6 mb-6
          overflow-y-auto
          pr-4 pl-4 md:pr-8 md:pl-8
          z-10
          ${theme === "dark" ? "text-white" : "text-[#090c64]"}
        `}
      >
        {/* Topbar (scrolls with content) */}
        <div className="mb-6">
          <Topbar />
        </div>

        {/* Routed page content */}
        <div className="app-page-content">
          <Outlet />
        </div>
      </section>
    </>
  );
};

export default PublicLayout;
