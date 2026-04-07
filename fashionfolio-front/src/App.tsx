import { Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { FeedPage } from "./pages/FeedPage";
import { WardrobePage } from "./pages/WardrobePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ExplorePage } from "./pages/ExplorePage";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { FriendsPage } from "./pages/FriendsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Layout>
  );
}
