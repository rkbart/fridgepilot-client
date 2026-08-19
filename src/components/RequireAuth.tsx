import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
