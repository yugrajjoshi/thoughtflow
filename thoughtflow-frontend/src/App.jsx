import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Authpage";
import Home from "./pages/Home";
import Signup from "./pages/signup";
import Profilesetup from "./pages/profilesetup";
import HashtagPage from "./pages/HashtagPage";
import ResetRequest from "./pages/ResetRequest";
import ResetPassword from "./pages/ResetPassword";
import SearchPage from "./pages/SearchPage";
import Settings from "./pages/Settings";

function App() {
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem("thoughtflow_theme") || "dark";
      document.documentElement.dataset.theme = theme;
      document.body.dataset.theme = theme;
    };

    applyTheme();
    window.addEventListener("storage", applyTheme);
    return () => window.removeEventListener("storage", applyTheme);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Home />} />
        <Route path="/profile/:username" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profilesetup" element={<Profilesetup />} />
        <Route path="/hashtag/:hashtagId" element={<HashtagPage />} />
        <Route path="/forgot-password" element={<ResetRequest />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;