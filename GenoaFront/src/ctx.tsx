import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { AuthApiError, getCurrentUser, loginUser, logoutUser, registerUser } from './api';
import { useStorageState } from './useStorageState';

const AuthContext = createContext<any>({
  signIn: async () => ({ message: '', status: 'authenticated' }),
  signUp: async () => ({ message: '', status: 'authenticated' }),
  signOut: async () => undefined,
  session: null,
  user: null,
  pendingApprovalEmail: null,
  isLoading: false,
});

function parseStoredUser(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function useSession() {
  const value = use(AuthContext);

  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider({ children }: any) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [[isUserLoading, storedUser], setStoredUser] = useStorageState('session_user');
  const [[isPendingApprovalLoading, pendingApprovalEmail], setPendingApprovalEmail] =
    useStorageState('pending_approval_email');
  const [user, setUser] = useState(null);
  const [isRefreshingSession, setIsRefreshingSession] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    setUser(parseStoredUser(storedUser));
  }, [isUserLoading, storedUser]);

  useEffect(() => {
    if (isLoading || isUserLoading || isPendingApprovalLoading) {
      return;
    }

    if (!session) {
      setIsRefreshingSession(false);
      return;
    }

    let isCancelled = false;

    const refreshSession = async () => {
      setIsRefreshingSession(true);

      try {
        const response = await getCurrentUser(session);

        if (isCancelled) {
          return;
        }

        const serializedUser = JSON.stringify(response.data.user);
        setUser(response.data.user);
        setStoredUser(serializedUser);
        setPendingApprovalEmail(null);
      } catch {
        if (isCancelled) {
          return;
        }

        setUser(null);
        setSession(null);
        setStoredUser(null);
      } finally {
        if (!isCancelled) {
          setIsRefreshingSession(false);
        }
      }
    };

    void refreshSession();

    return () => {
      isCancelled = true;
    };
  }, [
    isLoading,
    isPendingApprovalLoading,
    isUserLoading,
    session,
    setPendingApprovalEmail,
    setSession,
    setStoredUser,
  ]);

  const authenticate = useCallback(
    async (input: { email: string; password: string }) => {
      try {
        const response = await loginUser(input);
        const serializedUser = JSON.stringify(response.data.user);

        setUser(response.data.user);
        setSession(response.data.token);
        setStoredUser(serializedUser);
        setPendingApprovalEmail(null);

        return {
          message: response.message,
          status: 'authenticated',
        };
      } catch (error) {
        if (error instanceof AuthApiError && error.code === 'ACCOUNT_NOT_APPROVED') {
          setUser(null);
          setSession(null);
          setStoredUser(null);
          setPendingApprovalEmail(input.email);

          return {
            message: error.message,
            status: 'pending-approval',
          };
        }

        throw error;
      }
    },
    [setPendingApprovalEmail, setSession, setStoredUser]
  );

  const value = useMemo(
    () => ({
      async signIn(input: { email: string; password: string }) {
        return authenticate(input);
      },

      async signUp(input: { name: string; email: string; password: string }) {
        const response = await registerUser(input);

        if (response.data.user.isApproved) {
          return authenticate({ email: input.email, password: input.password });
        }

        setUser(null);
        setSession(null);
        setStoredUser(null);
        setPendingApprovalEmail(input.email);

        return {
          message: response.message,
          status: 'pending-approval',
        };
      },

      async signOut() {
        if (session) {
          try {
            await logoutUser(session);
          } catch {
            // Clear the local session even if the server is unreachable.
          }
        }

        setUser(null);
        setSession(null);
        setStoredUser(null);
        setPendingApprovalEmail(null);
      },

      session,
      user,
      pendingApprovalEmail,
      isLoading: isLoading || isUserLoading || isPendingApprovalLoading || isRefreshingSession,
    }),
    [
      authenticate,
      isLoading,
      isPendingApprovalLoading,
      isRefreshingSession,
      isUserLoading,
      pendingApprovalEmail,
      session,
      setPendingApprovalEmail,
      setSession,
      setStoredUser,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
