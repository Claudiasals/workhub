import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import bgLight from "../assets/bg/bg.jpg";
import bgDark from "../assets/bg/bgScuro.jpg";
import Logo from "../assets/logo/LogoCompletoSenzaBG.png";
import logoDark from "../assets/logo/logoVuoto.png";

const HomePage = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Theme-based assets and text color
  const backgroundImage = theme === "dark" ? bgDark : bgLight;
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  return (
    <main
      className="w-full min-h-screen flex justify-center items-center relative overflow-hidden 
      bg-white dark:bg-black transition-colors duration-500"
    >
      {/* Background image */}
      <img
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        alt="Background gradient"
        src={backgroundImage}
      />

      {/* Glass overlay container */}
      <div
        className="absolute top-[5%] left-[10%] w-[80%] max-w-[90%] h-[90%] transition-all duration-500"
      />

      {/* Main logo */}
      <img
        className="absolute top-[32%] sm:top-[34%] md:top-[27%] left-1/2 md:left-[45%] transform -translate-x-1/2 
        w-[70%] sm:w-[60%] md:w-[45%] lg:w-[35%] max-w-[599px] h-auto aspect-[1.82] object-cover"
        alt="WorkHub logo"
        src={theme === "dark" ? logoDark : Logo}
      />

      {/* Slogan text */}
      <h1
        className={`absolute top-[54%] sm:top-[58%] left-1/2 transform -translate-x-1/2 text-center
        text-xl sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-normal 
        leading-normal whitespace-nowrap transition-colors duration-500 ${textColor}`}
      >
        {t("slogan")}
      </h1>

      {/* Welcome button */}
      <Link
        to="/login"
        role="button"
        className={`absolute top-[70%] sm:top-[68%] left-1/2 transform -translate-x-1/2 
        w-[70%] sm:w-[60%] md:w-[50%] lg:w-[350px] lg:top-[70%] h-12 sm:h-14 flex items-center justify-center 
        text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-normal leading-normal 
        bg-white/20 dark:bg-white/10 backdrop-blur-sm border rounded-xl border-white/30 dark:border-white/90 
        cursor-pointer transition-colors duration-300 ${textColor} 
        hover:bg-white/30 hover:backdrop-blur-sm hover:shadow-lg`}
      >
        {t("benvenuto")}
      </Link>
    </main>
  );
};

export default HomePage;
