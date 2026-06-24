import {
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext.jsx';

function ProtectedRoute() {
  const { user, loading } =
    useAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <section className="auth-loading-screen">
        <div className="auth-loader" />

        <p>
          Checking authentication...
        </p>
      </section>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;