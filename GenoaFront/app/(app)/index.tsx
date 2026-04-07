import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthApiError, getMembers } from '../../src/authApi';
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
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 96, gap: 16 }}>
        <View>
          <Text>Liste des membres</Text>
        </View>

        {isLoading ? <Text>Chargement...</Text> : null}
        {error ? <Text>{error}</Text> : null}

        {!isLoading && !error ? (
          <View>
            <Text selectable>{membersJson}</Text>
          </View>
        ) : null}
      </ScrollView>

      {canAddElement ? (
        <Pressable
          onPress={() => router.push('/(app)/add')}
          style={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000000',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 28 }}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
