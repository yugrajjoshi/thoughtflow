import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Authpage";
import Home from "./pages/Home";
import Signup from "./pages/signup";
import Profilesetup from "./pages/profilesetup";
import HashtagPage from "./pages/HashtagPage";
import ResetPassword from "./pages/ResetPassword";

function App() {
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
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;