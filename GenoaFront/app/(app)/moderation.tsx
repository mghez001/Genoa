import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  approvePendingUser,
  AuthApiError,
  getApprovedUsers,
  getPendingUsers,
  rejectPendingUser,
  updateUserRole,
} from '../../src/api';
import { appStyles } from '../../src/appStyles';
import { useSession } from '../../src/ctx';

export default function Moderation() {
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
            : 'Impossible de charger les utilisateurs approuvés.';

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
          : 'Impossible de modifier le rôle de cet utilisateur.';

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
    <ScrollView style={appStyles.pageScreen} contentContainerStyle={appStyles.pageContent}>
      <View style={appStyles.pageHeader}>
        <Text style={appStyles.title}>Modération</Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Changer le rôle des membres</Text>

        {!canManageRoles ? (
          <Text style={appStyles.itemText}>
            Cette section est réservée aux éditeurs et aux administrateurs.
          </Text>
        ) : null}
        {canManageRoles && isRolesLoading ? <Text style={appStyles.itemText}>Chargement...</Text> : null}
        {canManageRoles && rolesError ? (
          <View style={[appStyles.messageBox, appStyles.errorMessage]}>
            <Text style={appStyles.messageText}>{rolesError}</Text>
          </View>
        ) : null}
        {canManageRoles && rolesFeedback ? (
          <View style={[appStyles.messageBox, appStyles.infoMessage]}>
            <Text style={appStyles.messageText}>{rolesFeedback}</Text>
          </View>
        ) : null}
        {canManageRoles && !isRolesLoading && approvedUsers.length === 0 ? (
          <Text style={appStyles.itemText}>Aucun utilisateur approuvé.</Text>
        ) : null}

        {canManageRoles &&
          approvedUsers.map((approvedUser: any) => (
            <Pressable
              key={approvedUser._id}
              onPress={() => {
                setSelectedRoleUserId(approvedUser._id);
              }}
              style={[
                appStyles.listItem,
                selectedRoleUserId === approvedUser._id ? appStyles.listItemSelected : null,
              ]}>
              <Text style={appStyles.itemTitle}>{approvedUser.name}</Text>
              <Text style={appStyles.itemText}>{approvedUser.email}</Text>
              <Text style={appStyles.itemText}>Rôle actuel : {approvedUser.role}</Text>
            </Pressable>
          ))}

        {canManageRoles && selectedRoleUser ? (
          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Utilisateur sélectionné</Text>
            <Text style={appStyles.itemTitle}>{selectedRoleUser.name}</Text>
            <Text style={appStyles.itemText}>{selectedRoleUser.email}</Text>
            <Text style={appStyles.itemText}>Rôle actuel : {selectedRoleUser.role}</Text>

            <View style={appStyles.row}>
              {assignableRoles.map((role) => (
                <Pressable
                  key={role}
                  disabled={roleActionUserId === selectedRoleUser._id}
                  onPress={() => {
                    void handleRoleChange(role);
                  }}
                  style={[
                    appStyles.secondaryButton,
                    selectedRoleUser.role === role ? appStyles.secondaryButtonSelected : null,
                  ]}>
                  <Text style={appStyles.secondaryButtonText}>
                    {roleActionUserId === selectedRoleUser._id ? 'Traitement...' : `Passer ${role}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Utilisateurs en attente d&apos;approbation</Text>

        {!isAdmin ? (
          <Text style={appStyles.itemText}>Cette section est réservée aux administrateurs.</Text>
        ) : null}
        {isAdmin && isPendingLoading ? <Text style={appStyles.itemText}>Chargement...</Text> : null}
        {isAdmin && pendingError ? (
          <View style={[appStyles.messageBox, appStyles.errorMessage]}>
            <Text style={appStyles.messageText}>{pendingError}</Text>
          </View>
        ) : null}
        {isAdmin && pendingFeedback ? (
          <View style={[appStyles.messageBox, appStyles.infoMessage]}>
            <Text style={appStyles.messageText}>{pendingFeedback}</Text>
          </View>
        ) : null}
        {isAdmin && !isPendingLoading && pendingUsers.length === 0 ? (
          <Text style={appStyles.itemText}>Aucun utilisateur en attente.</Text>
        ) : null}

        {isAdmin &&
          pendingUsers.map((pendingUser: any) => (
            <Pressable
              key={pendingUser._id}
              onPress={() => {
                setSelectedPendingUserId(pendingUser._id);
              }}
              style={[
                appStyles.listItem,
                selectedPendingUserId === pendingUser._id ? appStyles.listItemSelected : null,
              ]}>
              <Text style={appStyles.itemTitle}>{pendingUser.name}</Text>
              <Text style={appStyles.itemText}>{pendingUser.email}</Text>
              <Text style={appStyles.itemText}>Rôle : {pendingUser.role}</Text>
            </Pressable>
          ))}

        {isAdmin && selectedPendingUser ? (
          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Utilisateur sélectionné</Text>
            <Text style={appStyles.itemTitle}>{selectedPendingUser.name}</Text>
            <Text style={appStyles.itemText}>{selectedPendingUser.email}</Text>

            <View style={appStyles.row}>
              <Pressable
                disabled={pendingActionUserId === selectedPendingUser._id}
                onPress={() => {
                  void handleApprove();
                }}
                style={[
                  appStyles.primaryButton,
                  pendingActionUserId === selectedPendingUser._id
                    ? appStyles.primaryButtonDisabled
                    : null,
                ]}>
                <Text style={appStyles.primaryButtonText}>
                  {pendingActionUserId === selectedPendingUser._id ? 'Traitement...' : 'Autoriser'}
                </Text>
              </Pressable>

              <Pressable
                disabled={pendingActionUserId === selectedPendingUser._id}
                onPress={() => {
                  void handleReject();
                }}
                style={[
                  appStyles.secondaryButton,
                  pendingActionUserId === selectedPendingUser._id
                    ? appStyles.primaryButtonDisabled
                    : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Refuser</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
