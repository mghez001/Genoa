import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSession } from '../../src/ctx';

export default function Index() {
  const { signOut, user } = useSession();

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View>
        <Text>Informations du compte</Text>
      </View>

      <View>
        <Text>Nom</Text>
        <Text>{user?.name ?? 'Non renseigné'}</Text>
      </View>

      <View>
        <Text>Email</Text>
        <Text>{user?.email ?? 'Non renseigné'}</Text>
      </View>

      <View>
        <Text>Rôle</Text>
        <Text>{user?.role ?? 'Non renseigné'}</Text>
      </View>

      <View>
        <Text>Compte approuvé</Text>
        <Text>{user?.isApproved ? 'Oui' : 'Non'}</Text>
      </View>

      <View>
        <Text>Identifiant</Text>
        <Text>{user?._id ?? 'Non renseigné'}</Text>
      </View>

      <Pressable
        onPress={() => {
          void signOut();
        }}>
        <Text>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}
