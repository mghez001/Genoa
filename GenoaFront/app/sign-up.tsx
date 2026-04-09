import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AuthApiError } from '../src/api';
import { appColors, appStyles } from '../src/appStyles';
import { useSession } from '../src/ctx';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password || !passwordConfirmation) {
      setFeedback({
        type: 'error',
        text: 'Tous les champs sont requis pour créer un compte.',
      });
      return;
    }

    if (password !== passwordConfirmation) {
      setFeedback({
        type: 'error',
        text: 'Les mots de passe ne correspondent pas.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await signUp({
        name: normalizedName,
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
          <Text style={appStyles.title}>Inscription</Text>
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
          <Text style={appStyles.label}>Nom</Text>
          <TextInput
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={appColors.muted}
            style={appStyles.input}
            value={name}
          />
        </View>

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
            placeholder="Choisissez un mot de passe"
            placeholderTextColor={appColors.muted}
            secureTextEntry
            style={appStyles.input}
            value={password}
          />
        </View>

        <View style={appStyles.fieldGroup}>
          <Text style={appStyles.label}>Confirmer le mot de passe</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPasswordConfirmation}
            placeholder="Répétez le mot de passe"
            placeholderTextColor={appColors.muted}
            secureTextEntry
            style={appStyles.input}
            value={passwordConfirmation}
          />
        </View>

        <Pressable
          disabled={isSubmitting}
          onPress={() => {
            void handleSignUp();
          }}
          style={[
            appStyles.primaryButton,
            isSubmitting ? appStyles.primaryButtonDisabled : null,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={appStyles.primaryButtonText}>Inscription</Text>
          )}
        </Pressable>

        <Link href="/sign-in" asChild>
          <Pressable style={appStyles.textButton}>
            <Text style={appStyles.textButtonText}>
              Vous avez déjà un compte ? Connectez-vous.
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
