import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  apiRequest
} from '../services/api.js';

const AuthContext =
  createContext(null);

export function AuthProvider({
  children
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const refreshUser =
    useCallback(async () => {
      try {
        const result =
          await apiRequest(
            '/api/auth/me'
          );

        setUser(result.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  async function register(
    registrationData
  ) {
    const result = await apiRequest(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(
          registrationData
        )
      }
    );

    setUser(result.user);

    return result;
  }

  async function login(
    loginData
  ) {
    const result = await apiRequest(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(
          loginData
        )
      }
    );

    setUser(result.user);

    return result;
  }

  async function logout() {
    await apiRequest(
      '/api/auth/logout',
      {
        method: 'POST'
      }
    );

    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
      refreshUser
    }),
    [
      user,
      loading,
      refreshUser
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.'
    );
  }

  return context;
}