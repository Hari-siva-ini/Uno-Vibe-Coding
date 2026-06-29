import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SinglePlayerPage } from './pages/SinglePlayerPage';
import { LobbyPage } from './pages/LobbyPage';
import { JoinPage } from './pages/JoinPage';
import { MatchmakingPage } from './pages/MatchmakingPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { useSoundInit } from './hooks/useSound';

export default function App() {
  useSoundInit();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/single-player" element={<SinglePlayerPage />} />
      <Route path="/lobby/:code" element={<LobbyPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/matchmaking" element={<MatchmakingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
