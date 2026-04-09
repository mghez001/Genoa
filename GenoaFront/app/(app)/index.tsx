import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthApiError, getMembers } from '../../src/api';
import { appStyles } from '../../src/appStyles';
import { useSession } from '../../src/ctx';

export default function Index() {
  const router = useRouter();
  const { session, user } = useSession();
  const [membersJson, setMembersJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canAddElement = user?.role === 'admin' || user?.role === 'editor';

  useEffect(() => {
    if (!session) {
      setMembersJson('');
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getMembers(session);

        if (isCancelled) {
          return;
        }

        setMembersJson(JSON.stringify(response, null, 2));
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Impossible de charger les membres.';

        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      isCancelled = true;
    };
  }, [session]);

  return (
    <View style={appStyles.pageScreen}>
      <ScrollView contentContainerStyle={appStyles.pageContentWithFab}>
        <View style={appStyles.pageHeader}>
          <Text style={appStyles.title}>Arbre généalogique</Text>
        </View>

        {isLoading ? (
          <View style={appStyles.card}>
            <Text style={appStyles.itemText}>Chargement...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={[appStyles.messageBox, appStyles.errorMessage]}>
            <Text style={appStyles.messageText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <View style={appStyles.codeBlock}>
            <Text selectable style={appStyles.codeText}>
              {membersJson}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {canAddElement ? (
        <Pressable
          onPress={() => router.push('/(app)/add')}
          style={appStyles.floatingButton}>
          <Text style={appStyles.floatingButtonText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
