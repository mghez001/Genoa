import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { authStyles } from '../src/authStyles';
import { useSession } from '../src/ctx';

export default function PendingApprovalScreen() {
  const { pendingApprovalEmail } = useSession();

  return (
    <View style={authStyles.screen}>
      <View style={authStyles.topShape} />
      <View style={authStyles.bottomShape} />
      <View style={authStyles.content}>
        <View style={authStyles.card}>
          <Text style={authStyles.title}>Validation en attente</Text>
          <Text style={authStyles.subtitle}>
            Votre compte a bien ete cree. Un administrateur doit maintenant le valider avant votre
            premiere connexion.
          </Text>

          <View style={[authStyles.messageBox, authStyles.messageInfo]}>
            <Text style={authStyles.messageText}>
              {pendingApprovalEmail
                ? `Compte concerne : ${pendingApprovalEmail}`
                : "Vous pourrez vous connecter des que l'administrateur aura valide votre compte."}
            </Text>
          </View>

          <View style={authStyles.pendingActions}>
            <Link href="/sign-in" asChild>
              <Pressable style={authStyles.primaryAction}>
                <Text style={authStyles.primaryActionText}>Retour a la connexion</Text>
              </Pressable>
            </Link>

            <Link href="/sign-up" asChild>
              <Pressable style={authStyles.secondaryAction}>
                <Text style={authStyles.secondaryActionText}>Creer un autre compte</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
