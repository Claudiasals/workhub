import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";

import iconLogo from "../assets/logo/logoVuoto.png";
import iconLogo2 from "../assets/logo/LogoCompletoSenzaBg.png";
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
            fixed top-0 left-0 h-full z-40
            transition-all duration-700 ease-in-out
            ${
              theme === "dark"
                ? "bg-[#D0D8FB]/30"
                : "bg-linear-to-br from-indigo-950 via-indigo-950/90 to-violet-900"
            }
            backdrop-blur-sm border-r border-white/30 shadow-md
            flex flex-col w-[200px] md:w-[220px] py-2 px-4
          `}
        >
          {/* Sidebar logo (click to close) */}
          <div
            className="flex flex-col items-center gap-3 cursor-pointer mb-8"
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src={theme === "dark" ? iconLogo2 : iconLogo}
              alt="Logo"
              className="w-40 md:w-48 h-auto object-contain drop-shadow-md transition-all duration-700"
            />
          </div>

          {/* Sidebar navigation */}
          <div className="flex-1 w-full">
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

      {/* Main content area */}
      <section
        className={`
          transition-all duration-500 ease-in-out
          ${sidebarOpen ? "ml-[220px] md:ml-[215px]" : "ml-20 md:ml-[90px]"}
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
        <Outlet />
      </section>
    </>
  );
};

export default PublicLayout;
