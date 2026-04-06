import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AuthApiError } from '../src/authApi';
import { authStyles } from '../src/authStyles';
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
    <View style={authStyles.screen}>
      <View style={authStyles.topShape} />
      <View style={authStyles.bottomShape} />
      <View style={authStyles.content}>
        <View style={authStyles.card}>
          <Text style={authStyles.title}>Connexion</Text>
          <Text style={authStyles.subtitle}>
            Connectez-vous pour accéder à votre arbre généalogique et aux fonctionnalités de gestion.
          </Text>

          {feedback ? (
            <View
              style={[
                authStyles.messageBox,
                feedback.type === 'error' ? authStyles.messageError : authStyles.messageInfo,
              ]}>
              <Text style={authStyles.messageText}>{feedback.text}</Text>
            </View>
          ) : null}

          <View style={authStyles.fieldGroup}>
            <Text style={authStyles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="email@exemple.com"
              placeholderTextColor="#91836d"
              style={authStyles.input}
              value={email}
            />
          </View>

          <View style={authStyles.fieldGroup}>
            <Text style={authStyles.label}>Mot de passe</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              placeholderTextColor="#91836d"
              secureTextEntry
              style={authStyles.input}
              value={password}
            />
          </View>

          <Pressable
            disabled={isSubmitting}
            onPress={() => {
              void handleSignIn();
            }}
            style={[
              authStyles.primaryAction,
              isSubmitting ? authStyles.primaryActionDisabled : null,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#fffaf3" />
            ) : (
              <Text style={authStyles.primaryActionText}>Connexion</Text>
            )}
          </Pressable>

          <Link href="/sign-up" asChild>
            <Pressable style={authStyles.secondaryAction}>
              <Text style={authStyles.secondaryActionText}>Pas de compte ? Inscrivez-vous !</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
