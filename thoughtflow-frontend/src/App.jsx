import { useEffect, useState } from "react";
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
import Notifications from "./pages/Notifications";
import { X, ExternalLink } from "lucide-react";

function App() {
  const [activeMedia, setActiveMedia] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const target = event.target;
      if (!target) return;

      const isImg = target.tagName === 'IMG';
      if (isImg) {
        // Detect if clicked image is in profile view, profile section, or post view section
        const isAllowedContext = window.location.pathname.startsWith('/profile') || 
                                 !!target.closest('.profile-main-container') || 
                                 !!target.closest('.profile-view-section') ||
                                 !!target.closest('.profile-section') ||
                                 !!target.closest('.post-view-container');
        
        if (!isAllowedContext) return;

        // Allow opening post media (alt="Post") and profile pictures (alt="Profile Image")
        const isPostMedia = target.alt === 'Post';
        const isProfilePic = target.alt === 'Profile Image';

        if (isPostMedia || isProfilePic) {
          event.stopPropagation();
          event.preventDefault();
          setZoomLevel(1);
          setActiveMedia({
            src: target.src,
            type: 'image'
          });
        }
      }
    };

    document.body.addEventListener('click', handleGlobalClick, true);
    return () => document.body.removeEventListener('click', handleGlobalClick, true);
  }, []);

  return (
    <>
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
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>

      {activeMedia ? (
        <div 
          className="fixed inset-0 z-99999 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 transition-all duration-300"
          onClick={() => setActiveMedia(null)}
        >
          {/* Top Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            <a 
              href={activeMedia.src} 
              download 
              target="_blank" 
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition shadow-lg border border-zinc-800/80 flex items-center justify-center"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
            <button 
              type="button" 
              onClick={() => setActiveMedia(null)}
              className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition shadow-lg border border-zinc-800/80 flex items-center justify-center"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Media Container */}
          <div 
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeMedia.src} 
              alt="Expanded view" 
              onClick={() => setZoomLevel(prev => prev === 1 ? 1.7 : 1)}
              style={{ transform: `scale(${zoomLevel})`, cursor: zoomLevel === 1 ? 'zoom-in' : 'zoom-out' }}
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-zinc-850 shadow-[0_24px_50px_rgba(0,0,0,0.85)] transition-all duration-300 ease-out"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default App;