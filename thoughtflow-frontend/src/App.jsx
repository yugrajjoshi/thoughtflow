import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Authpage";
import Home from "./pages/Home";
import Profile from "./pages/profile";
import Signup from "./pages/signup";
import Profilesetup from "./pages/profilesetup";
import ProfileView from "./components/profileview";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profilesetup" element={<Profilesetup />} />
        <Route path="/profile/:username" element={<ProfileView />} />

      </Routes>
    </Router>
  );
}

export default App;