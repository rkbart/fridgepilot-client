import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Recipes from './pages/Recipes';
import Pantry from './pages/Pantry';
import GroceryListPage from './pages/GroceryList';
import AISuggestions from './pages/AISuggestions';
import Discover from './pages/Discover';
import SettingsPage from './pages/Settings';
import { isAuthenticated, logout } from './services/api';
import { useState } from 'react';
import './App.css';

const NAV_ITEMS = [
  { path: '/recipes', label: 'Recipes', icon: '📄' },
  { path: '/pantry', label: 'Pantry', icon: '🥫' },
  { path: '/discover', label: 'Discover', icon: '🔍' },
  { path: '/grocery-lists', label: 'Groceries', icon: '🛒' },
  { path: '/ai-suggestions', label: 'AI Helper', icon: '✨' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    navigate('/login');
  };

  if (!loggedIn) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>FridgePilot</h1>
        <span>Cook Smart</span>
      </div>
      <nav>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const location = useLocation();
  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="mobile-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <RequireAuth>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/grocery-lists" element={<GroceryListPage />} />
            <Route path="/ai-suggestions" element={<AISuggestions />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="*" element={<Navigate to="/recipes" replace />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </RequireAuth>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
