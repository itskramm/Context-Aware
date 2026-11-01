import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getAccessType } from '@/lib/authValidations';

export default function RoleRoute({ allow = [] }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const accessType = getAccessType(user);
  const hasAccess = allow.length === 0 || allow.includes(accessType);

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
