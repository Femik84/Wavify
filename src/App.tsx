import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authstore";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

// pages
import Home from "./pages/Home";
import NowPlaying from "./pages/NowPlaying";
import DailyMixPage from "./pages/DailyMixPage";
import Browse from "./pages/Browse";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import PlaylistPage from "./pages/PlaylistPage";

export default function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/welcome" element={<Welcome />} />

          {/* PROTECTED */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/now-playing" element={<NowPlaying />} />
            <Route path="/daily-mix/:mixId" element={<DailyMixPage />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/playlist/:entityId" element={<PlaylistPage />} />
            <Route path="/genre/:entityId" element={<PlaylistPage />} />
            <Route path="/artist/:entityId" element={<PlaylistPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
