import React, { useEffect, useState } from "react";
import logoDark from "../assets/logo.svg";
import logoLight from "../assets/logowhite.svg";

export default function Logo({ className = "", alt = "ThoughtFlow" }) {
  const getTheme = () => {
    if (typeof document !== "undefined") {
      return document.documentElement.dataset.theme || document.body.dataset.theme || localStorage.getItem("thoughtflow_theme") || "dark";
    }
    return localStorage.getItem("thoughtflow_theme") || "dark";
  };

  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const onStorage = () => setTheme(getTheme());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const src = theme === "light" ? logoLight : logoDark;

  return <img src={src} alt={alt} className={className} />;
}
