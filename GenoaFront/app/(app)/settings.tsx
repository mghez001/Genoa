import { Pressable, ScrollView, Text, View } from 'react-native';

import { appStyles } from '../../src/appStyles';
import { useSession } from '../../src/ctx';

export default function Settings() {
  const { signOut, user } = useSession();

  return (
    <ScrollView style={appStyles.pageScreen} contentContainerStyle={appStyles.pageContent}>
      <View style={appStyles.pageHeader}>
        <Text style={appStyles.title}>Paramètres</Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Informations du compte</Text>

        <View style={appStyles.infoRow}>
          <Text style={appStyles.infoLabel}>Nom</Text>
          <Text style={appStyles.infoValue}>{user?.name ?? 'Non renseigné'}</Text>
        </View>

        <View style={appStyles.infoRow}>
          <Text style={appStyles.infoLabel}>Email</Text>
          <Text style={appStyles.infoValue}>{user?.email ?? 'Non renseigné'}</Text>
        </View>

        <View style={appStyles.infoRow}>
          <Text style={appStyles.infoLabel}>Rôle</Text>
          <Text style={appStyles.infoValue}>{user?.role ?? 'Non renseigné'}</Text>
        </View>

        <View style={appStyles.infoRow}>
          <Text style={appStyles.infoLabel}>Compte approuvé</Text>
          <Text style={appStyles.infoValue}>{user?.isApproved ? 'Oui' : 'Non'}</Text>
        </View>

        <View style={appStyles.infoRow}>
          <Text style={appStyles.infoLabel}>Identifiant</Text>
          <Text style={appStyles.infoValue}>{user?._id ?? 'Non renseigné'}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          void signOut();
        }}
        style={appStyles.primaryButton}>
        <Text style={appStyles.primaryButtonText}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}
