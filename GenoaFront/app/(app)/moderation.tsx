import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView, Text, View } from 'react-native';

import {
  approvePendingUser,
  AuthApiError,
  getApprovedUsers,
  getPendingUsers,
  rejectPendingUser,
  updateUserRole,
} from '../../src/authApi';
import { useSession } from '../../src/ctx';

export default function Index() {
  const { session, user } = useSession();
  const canAccessModeration = user?.role === 'admin' || user?.role === 'editor';
  const isAdmin = user?.role === 'admin';
  const canManageRoles = user?.role === 'admin' || user?.role === 'editor';
  const assignableRoles = user?.role === 'admin' ? ['reader', 'editor', 'admin'] : ['reader', 'editor'];

  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [selectedRoleUserId, setSelectedRoleUserId] = useState<string | null>(null);
  const [rolesFeedback, setRolesFeedback] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [selectedPendingUserId, setSelectedPendingUserId] = useState<string | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [pendingActionUserId, setPendingActionUserId] = useState<string | null>(null);

  const selectedRoleUser =
    approvedUsers.find((approvedUser: any) => approvedUser._id === selectedRoleUserId) ?? null;
  const selectedPendingUser =
    pendingUsers.find((pendingUser: any) => pendingUser._id === selectedPendingUserId) ?? null;

  useEffect(() => {
    if (!session || !canManageRoles) {
      setApprovedUsers([]);
      setSelectedRoleUserId(null);
      setIsRolesLoading(false);
      return;
    }

    let isCancelled = false;

    const loadApprovedUsers = async () => {
      setIsRolesLoading(true);
      setRolesError(null);

      try {
        const response = await getApprovedUsers(session);

        if (isCancelled) {
          return;
        }

        setApprovedUsers(response.data.users);
        setSelectedRoleUserId((currentSelectedRoleUserId) => {
          if (
            currentSelectedRoleUserId &&
            response.data.users.some((approvedUser: any) => approvedUser._id === currentSelectedRoleUserId)
          ) {
            return currentSelectedRoleUserId;
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
            : 'Impossible de charger les utilisateurs approuves.';

        setRolesError(message);
      } finally {
        if (!isCancelled) {
          setIsRolesLoading(false);
        }
      }
    };

    void loadApprovedUsers();

    return () => {
      isCancelled = true;
    };
  }, [canManageRoles, session]);

  useEffect(() => {
    if (!session || !canAccessModeration || !isAdmin) {
      setPendingUsers([]);
      setSelectedPendingUserId(null);
      setIsPendingLoading(false);
      return;
    }

    let isCancelled = false;

    const loadPendingUsers = async () => {
      setIsPendingLoading(true);
      setPendingError(null);

      try {
        const response = await getPendingUsers(session);

        if (isCancelled) {
          return;
        }

        setPendingUsers(response.data.users);
        setSelectedPendingUserId((currentSelectedPendingUserId) => {
          if (
            currentSelectedPendingUserId &&
            response.data.users.some((pendingUser: any) => pendingUser._id === currentSelectedPendingUserId)
          ) {
            return currentSelectedPendingUserId;
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

        setPendingError(message);
      } finally {
        if (!isCancelled) {
          setIsPendingLoading(false);
        }
      }
    };

    void loadPendingUsers();

    return () => {
      isCancelled = true;
    };
  }, [canAccessModeration, isAdmin, session]);

  const handleRoleChange = async (role: string) => {
    if (!session || !selectedRoleUser) {
      return;
    }

    setRoleActionUserId(selectedRoleUser._id);
    setRolesFeedback(null);
    setRolesError(null);

    try {
      const response = await updateUserRole(session, selectedRoleUser._id, role);

      setApprovedUsers((currentUsers) =>
        currentUsers.map((approvedUser: any) => {
          if (approvedUser._id !== selectedRoleUser._id) {
            return approvedUser;
          }

          return {
            ...approvedUser,
            role,
          };
        })
      );
      setRolesFeedback(response.message);
    } catch (roleError) {
      const message =
        roleError instanceof AuthApiError
          ? roleError.message
          : 'Impossible de modifier le role de cet utilisateur.';

      setRolesError(message);
    } finally {
      setRoleActionUserId(null);
    }
  };

  const handleApprove = async () => {
    if (!session || !selectedPendingUser) {
      return;
    }

    setPendingActionUserId(selectedPendingUser._id);
    setPendingFeedback(null);
    setPendingError(null);

    try {
      const response = await approvePendingUser(session, selectedPendingUser._id);
      const approvedUser = {
        ...selectedPendingUser,
        isApproved: true,
      };
      const remainingUsers = pendingUsers.filter(
        (pendingUser: any) => pendingUser._id !== selectedPendingUser._id
      );

      setPendingUsers(remainingUsers);
      setSelectedPendingUserId((currentSelectedPendingUserId) => {
        if (currentSelectedPendingUserId !== selectedPendingUser._id) {
          return currentSelectedPendingUserId;
        }

        return remainingUsers[0]?._id ?? null;
      });
      setApprovedUsers((currentUsers) => [...currentUsers, approvedUser]);
      setPendingFeedback(response.message);
    } catch (approveError) {
      const message =
        approveError instanceof AuthApiError
          ? approveError.message
          : "Impossible d'approuver cet utilisateur.";

      setPendingError(message);
    } finally {
      setPendingActionUserId(null);
    }
  };

  const handleReject = async () => {
    if (!session || !selectedPendingUser) {
      return;
    }

    setPendingActionUserId(selectedPendingUser._id);
    setPendingFeedback(null);
    setPendingError(null);

    try {
      const response = await rejectPendingUser(session, selectedPendingUser._id);
      const remainingUsers = pendingUsers.filter(
        (pendingUser: any) => pendingUser._id !== selectedPendingUser._id
      );

      setPendingUsers(remainingUsers);
      setSelectedPendingUserId((currentSelectedPendingUserId) => {
        if (currentSelectedPendingUserId !== selectedPendingUser._id) {
          return currentSelectedPendingUserId;
        }

        return remainingUsers[0]?._id ?? null;
      });
      setPendingFeedback(response.message);
    } catch (rejectError) {
      const message =
        rejectError instanceof AuthApiError
          ? rejectError.message
          : 'Impossible de refuser cet utilisateur.';

      setPendingError(message);
    } finally {
      setPendingActionUserId(null);
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
          <Text>Changer le role des membres</Text>

          {!canManageRoles ? <Text>Cette section est reservee aux editeurs et administrateurs.</Text> : null}
          {canManageRoles && isRolesLoading ? <Text>Chargement...</Text> : null}
          {canManageRoles && rolesError ? <Text>{rolesError}</Text> : null}
          {canManageRoles && rolesFeedback ? <Text>{rolesFeedback}</Text> : null}

          {canManageRoles && !isRolesLoading && approvedUsers.length === 0 ? (
            <Text>Aucun utilisateur approuve.</Text>
          ) : null}

          {canManageRoles &&
            approvedUsers.map((approvedUser: any) => (
              <Pressable
                key={approvedUser._id}
                onPress={() => {
                  setSelectedRoleUserId(approvedUser._id);
                }}>
                <View>
                  <Text>{approvedUser.name}</Text>
                  <Text>{approvedUser.email}</Text>
                  <Text>Role actuel: {approvedUser.role}</Text>
                  <Text>
                    {selectedRoleUserId === approvedUser._id
                      ? 'Selectionne'
                      : 'Cliquer pour selectionner'}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>

        {canManageRoles && selectedRoleUser ? (
          <View>
            <Text>Utilisateur selectionne pour le changement de role</Text>
            <Text>{selectedRoleUser.name}</Text>
            <Text>{selectedRoleUser.email}</Text>
            <Text>Role actuel: {selectedRoleUser.role}</Text>

            {assignableRoles.map((role) => (
              <Button
                key={role}
                disabled={roleActionUserId === selectedRoleUser._id}
                onPress={() => {
                  void handleRoleChange(role);
                }}
                title={roleActionUserId === selectedRoleUser._id ? 'Traitement...' : `Passer ${role}`}
              />
            ))}
          </View>
        ) : null}

        <View>
          <Text>Utilisateurs en attente d&apos;approbation</Text>

          {!isAdmin ? <Text>Cette section est reservee aux administrateurs.</Text> : null}
          {isAdmin && isPendingLoading ? <Text>Chargement...</Text> : null}
          {isAdmin && pendingError ? <Text>{pendingError}</Text> : null}
          {isAdmin && pendingFeedback ? <Text>{pendingFeedback}</Text> : null}

          {isAdmin && !isPendingLoading && pendingUsers.length === 0 ? (
            <Text>Aucun utilisateur en attente.</Text>
          ) : null}

          {isAdmin &&
            pendingUsers.map((pendingUser: any) => (
              <Pressable
                key={pendingUser._id}
                onPress={() => {
                  setSelectedPendingUserId(pendingUser._id);
                }}>
                <View>
                  <Text>{pendingUser.name}</Text>
                  <Text>{pendingUser.email}</Text>
                  <Text>Role: {pendingUser.role}</Text>
                  <Text>
                    {selectedPendingUserId === pendingUser._id
                      ? 'Selectionne'
                      : 'Cliquer pour selectionner'}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>

        {isAdmin && selectedPendingUser ? (
          <View>
            <Text>Utilisateur selectionne</Text>
            <Text>{selectedPendingUser.name}</Text>
            <Text>{selectedPendingUser.email}</Text>

            <Button
              disabled={pendingActionUserId === selectedPendingUser._id}
              onPress={() => {
                void handleApprove();
              }}
              title={pendingActionUserId === selectedPendingUser._id ? 'Traitement...' : 'Autoriser'}
            />
            <Button
              disabled={pendingActionUserId === selectedPendingUser._id}
              onPress={() => {
                void handleReject();
              }}
              title={pendingActionUserId === selectedPendingUser._id ? 'Traitement...' : 'Refuser'}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
