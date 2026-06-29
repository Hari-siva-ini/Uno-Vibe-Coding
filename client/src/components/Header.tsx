import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Header() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-display font-bold bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 bg-clip-text text-transparent">
            UNO
          </span>
          <span className="text-sm text-slate-400 group-hover:text-white transition-colors hidden sm:inline">
            Online
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link to="/leaderboard" className="text-sm text-slate-300 hover:text-white transition-colors px-2 py-1">
            Leaderboard
          </Link>
          <Link to="/settings" className="text-sm text-slate-300 hover:text-white transition-colors px-2 py-1">
            Settings
          </Link>
          {isAuthenticated() ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
                <span className="text-xl">{user?.avatar}</span>
                <span className="text-sm text-slate-300 hidden sm:inline">{user?.username}</span>
              </Link>
              <button onClick={logout} className="btn-secondary text-sm py-2 px-3">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
