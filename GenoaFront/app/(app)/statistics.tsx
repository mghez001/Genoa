import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AuthApiError, getFamilyStats } from '../../src/authApi';
import { useSession } from '../../src/ctx';

export default function Index() {
  const { session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getFamilyStats(session);

        if (isCancelled) {
          return;
        }

        setStats(response.data);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Impossible de charger les statistiques.';

        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      isCancelled = true;
    };
  }, [session]);

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View>
        <Text>Statistiques familiales</Text>
      </View>

      {isLoading ? <Text>Chargement...</Text> : null}
      {error ? <Text>{error}</Text> : null}

      {!isLoading && !error && stats ? (
        <>
          <View>
            <Text>Nombre total de membres</Text>
            <Text>{stats.totalMembers}</Text>
          </View>

          <View>
            <Text>Nombre d'hommes</Text>
            <Text>{stats.totalMen}</Text>
          </View>

          <View>
            <Text>Nombre de femmes</Text>
            <Text>{stats.totalWomen}</Text>
          </View>

          <View>
            <Text>Espérance de vie moyenne</Text>
            <Text>{stats.averageLifeExpectancy ?? 'Non disponible'}</Text>
          </View>

          <View>
            <Text>Nombre moyen d'enfants par couple</Text>
            <Text>{stats.averageChildrenPerCouple}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
