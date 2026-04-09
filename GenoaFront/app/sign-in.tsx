import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AuthApiError } from '../src/api';
import { appColors, appStyles } from '../src/appStyles';
import { useSession } from '../src/ctx';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setFeedback({
        type: 'error',
        text: 'Renseignez votre email et votre mot de passe.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await signIn({
        email: normalizedEmail,
        password,
      });

      if (result.status === 'pending-approval') {
        setFeedback({ type: 'info', text: result.message });
        router.replace('/pending-approval');
      }
    } catch (error) {
      const message =
        error instanceof AuthApiError ? error.message : 'Une erreur inattendue est survenue.';

      setFeedback({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={appStyles.authScreen}>
      <View style={appStyles.authCard}>
        <View style={appStyles.pageHeader}>
          <Text style={appStyles.title}>Connexion</Text>
        </View>

        {feedback ? (
          <View
            style={[
              appStyles.messageBox,
              feedback.type === 'error' ? appStyles.errorMessage : appStyles.infoMessage,
            ]}>
            <Text style={appStyles.messageText}>{feedback.text}</Text>
          </View>
        ) : null}

        <View style={appStyles.fieldGroup}>
          <Text style={appStyles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="email@exemple.com"
            placeholderTextColor={appColors.muted}
            style={appStyles.input}
            value={email}
          />
        </View>

        <View style={appStyles.fieldGroup}>
          <Text style={appStyles.label}>Mot de passe</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Votre mot de passe"
            placeholderTextColor={appColors.muted}
            secureTextEntry
            style={appStyles.input}
            value={password}
          />
        </View>

        <Pressable
          disabled={isSubmitting}
          onPress={() => {
            void handleSignIn();
          }}
          style={[
            appStyles.primaryButton,
            isSubmitting ? appStyles.primaryButtonDisabled : null,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={appStyles.primaryButtonText}>Connexion</Text>
          )}
        </Pressable>

        <Link href="/sign-up" asChild>
          <Pressable style={appStyles.textButton}>
            <Text style={appStyles.textButtonText}>Pas de compte ? Inscrivez-vous.</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
