import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AuthApiError, getFamilyStats } from '../../src/api';
import { appStyles } from '../../src/appStyles';
import { useSession } from '../../src/ctx';

export default function Statistics() {
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
    <ScrollView style={appStyles.pageScreen} contentContainerStyle={appStyles.pageContent}>
      <View style={appStyles.pageHeader}>
        <Text style={appStyles.title}>Statistiques</Text>
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

      {!isLoading && !error && stats ? (
        <>
          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Nombre total de membres</Text>
            <Text style={appStyles.statValue}>{stats.totalMembers}</Text>
          </View>

          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Nombre d&apos;hommes</Text>
            <Text style={appStyles.statValue}>{stats.totalMen}</Text>
          </View>

          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Nombre de femmes</Text>
            <Text style={appStyles.statValue}>{stats.totalWomen}</Text>
          </View>

          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Espérance de vie moyenne</Text>
            <Text style={appStyles.statValue}>{stats.averageLifeExpectancy ?? 'Non disponible'}</Text>
          </View>

          <View style={appStyles.card}>
            <Text style={appStyles.cardTitle}>Nombre moyen d&apos;enfants par couple</Text>
            <Text style={appStyles.statValue}>{stats.averageChildrenPerCouple}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
