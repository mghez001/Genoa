import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView, Text, View } from 'react-native';

import {
  approvePendingUser,
  AuthApiError,
  getPendingUsers,
  rejectPendingUser,
} from '../../src/authApi';
import { useSession } from '../../src/ctx';

export default function Index() {
  const { session, user } = useSession();
  const canAccessModeration = user?.role === 'admin' || user?.role === 'editor';
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const selectedUser = pendingUsers.find((pendingUser: any) => pendingUser._id === selectedUserId) ?? null;

  useEffect(() => {
    if (!session || !canAccessModeration) {
      return;
    }

    let isCancelled = false;

    const loadPendingUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getPendingUsers(session);

        if (isCancelled) {
          return;
        }

        setPendingUsers(response.data.users);
        setSelectedUserId((currentSelectedUserId) => {
          if (
            currentSelectedUserId &&
            response.data.users.some((pendingUser: any) => pendingUser._id === currentSelectedUserId)
          ) {
            return currentSelectedUserId;
          }

          return response.data.users[0]?._id ?? null;
        });
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Impossible de charger les utilisateurs en attente.';

        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPendingUsers();

    return () => {
      isCancelled = true;
    };
  }, [canAccessModeration, session]);

  const handleApprove = async () => {
    if (!session || !selectedUser) {
      return;
    }

    setActionUserId(selectedUser._id);
    setFeedback(null);
    setError(null);

    try {
      const response = await approvePendingUser(session, selectedUser._id);

      const remainingUsers = pendingUsers.filter((pendingUser: any) => pendingUser._id !== selectedUser._id);

      setPendingUsers(remainingUsers);
      setSelectedUserId((currentSelectedUserId) => {
        if (currentSelectedUserId !== selectedUser._id) {
          return currentSelectedUserId;
        }

        return remainingUsers[0]?._id ?? null;
      });
      setFeedback(response.message);
    } catch (approveError) {
      const message =
        approveError instanceof AuthApiError
          ? approveError.message
          : "Impossible d'approuver cet utilisateur.";

      setError(message);
    } finally {
      setActionUserId(null);
    }
  };

  const handleReject = async () => {
    if (!session || !selectedUser) {
      return;
    }

    setActionUserId(selectedUser._id);
    setFeedback(null);
    setError(null);

    try {
      const response = await rejectPendingUser(session, selectedUser._id);

      const remainingUsers = pendingUsers.filter((pendingUser: any) => pendingUser._id !== selectedUser._id);

      setPendingUsers(remainingUsers);
      setSelectedUserId((currentSelectedUserId) => {
        if (currentSelectedUserId !== selectedUser._id) {
          return currentSelectedUserId;
        }

        return remainingUsers[0]?._id ?? null;
      });
      setFeedback(response.message);
    } catch (rejectError) {
      const message =
        rejectError instanceof AuthApiError
          ? rejectError.message
          : 'Impossible de refuser cet utilisateur.';

      setError(message);
    } finally {
      setActionUserId(null);
    }
  };

  if (!canAccessModeration) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView>
      <View>
        <Text>MODERATION</Text>

        <View>
          <Text>Utilisateurs en attente d'approbation</Text>

          {isLoading ? <Text>Chargement...</Text> : null}
          {error ? <Text>{error}</Text> : null}
          {feedback ? <Text>{feedback}</Text> : null}

          {!isLoading && pendingUsers.length === 0 ? (
            <Text>Aucun utilisateur en attente.</Text>
          ) : null}

          {pendingUsers.map((pendingUser: any) => (
            <Pressable
              key={pendingUser._id}
              onPress={() => {
                setSelectedUserId(pendingUser._id);
              }}>
              <View>
                <Text>{pendingUser.name}</Text>
                <Text>{pendingUser.email}</Text>
                <Text>Role: {pendingUser.role}</Text>
                <Text>{selectedUserId === pendingUser._id ? 'Selectionne' : 'Cliquer pour selectionner'}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {selectedUser ? (
          <View>
            <Text>Utilisateur selectionne</Text>
            <Text>{selectedUser.name}</Text>
            <Text>{selectedUser.email}</Text>

            <Button
              disabled={actionUserId === selectedUser._id}
              onPress={() => {
                void handleApprove();
              }}
              title={actionUserId === selectedUser._id ? 'Traitement...' : 'Autoriser'}
            />
            <Button
              disabled={actionUserId === selectedUser._id}
              onPress={() => {
                void handleReject();
              }}
              title={actionUserId === selectedUser._id ? 'Traitement...' : 'Refuser'}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
