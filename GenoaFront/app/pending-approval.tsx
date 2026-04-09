import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { appStyles } from '../src/appStyles';
import { useSession } from '../src/ctx';

export default function PendingApprovalScreen() {
  const { pendingApprovalEmail } = useSession();

  return (
    <View style={appStyles.authScreen}>
      <View style={appStyles.authCard}>
        <View style={appStyles.pageHeader}>
          <Text style={appStyles.title}>Validation en attente</Text>
          <Text style={appStyles.subtitle}>
            Votre compte a bien été créé. Un administrateur doit maintenant le valider avant votre
            première connexion.
          </Text>
        </View>

        <View style={[appStyles.messageBox, appStyles.infoMessage]}>
          <Text style={appStyles.messageText}>
            {pendingApprovalEmail
              ? `Compte concerné : ${pendingApprovalEmail}`
              : 'Vous pourrez vous connecter dès que votre compte sera validé.'}
          </Text>
        </View>

        <Link href="/sign-in" asChild>
          <Pressable style={appStyles.primaryButton}>
            <Text style={appStyles.primaryButtonText}>Retour à la connexion</Text>
          </Pressable>
        </Link>

        <Link href="/sign-up" asChild>
          <Pressable style={appStyles.secondaryButton}>
            <Text style={appStyles.secondaryButtonText}>Créer un autre compte</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
