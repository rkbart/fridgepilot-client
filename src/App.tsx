import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import Pantry from './pages/Pantry';
import GroceryListPage from './pages/GroceryList';
import Discover from './pages/Discover';
import { isAuthenticated, logout, getCurrentUser } from './services/api';
import { PantryProvider } from './contexts/PantryContext';
import { RecipesProvider } from './contexts/RecipesContext';
import { GroceryListProvider } from './contexts/GroceryListContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ path: '/dashboard', label: 'Home', icon: '🏠' }],
  },
  {
    label: 'Discover',
    items: [
      { path: '/discover', label: 'Discover', icon: '🔍' },

    ],
  },
  {
    label: 'Manage',
    items: [
      { path: '/pantry', label: 'Pantry', icon: '🥫' },
      { path: '/recipes', label: 'Recipes', icon: '📄' },
      { path: '/grocery-lists', label: 'Groceries', icon: '🛒' },
    ],
  },

];

const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

function useCurrentUser() {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    getCurrentUser()
      .then((res) => setUser(res.user))
      .catch(() => {});
  }, []);

  return user;
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const user = useCurrentUser();

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    navigate('/login');
  };

  if (!loggedIn) return null;

  const displayName = user?.name || user?.email?.split('@')[0] || '';
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>FridgePilot</h1>
        <span>Cook Smart</span>
      </div>
      <nav>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="nav-group">
            {group.label && <span className="nav-group-label">{group.label}</span>}
            {group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-profile">
            <span className="sidebar-avatar" aria-hidden="true">{initial}</span>
            <span className="sidebar-profile-info">
              <span className="sidebar-profile-name">{displayName || 'Account'}</span>
              <span className="sidebar-profile-email">{user.email}</span>
            </span>
          </div>
        )}
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
      <PantryProvider>
        <RecipesProvider>
          <GroceryListProvider>
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/recipes" element={<Recipes />} />
                  <Route path="/pantry" element={<Pantry />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/grocery-lists" element={<GroceryListPage />} />

                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
              <MobileNav />
            </div>
          </GroceryListProvider>
        </RecipesProvider>
      </PantryProvider>
    </RequireAuth>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
