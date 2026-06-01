import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_ROOTS = "[data-main-scroll], [data-page-scroll]";

const resetScroll = (element) => {
  element.scrollTop = 0;
  element.scrollLeft = 0;
};

/**
 * Resets scroll position on route change.
 * Scroll happens on the layout shell and on some page-level wrappers.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.querySelectorAll(SCROLL_ROOTS).forEach(resetScroll);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
