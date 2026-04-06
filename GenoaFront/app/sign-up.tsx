import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AuthApiError } from '../src/authApi';
import { authStyles } from '../src/authStyles';
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
    <View style={authStyles.screen}>
      <View style={authStyles.topShape} />
      <View style={authStyles.bottomShape} />
      <View style={authStyles.content}>
        <View style={authStyles.card}>
          <Text style={authStyles.title}>Inscription</Text>
          <Text style={authStyles.subtitle}>
            Créez votre compte Genoa. Les nouveaux comptes doivent ensuite être validés par un
            administrateur.
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
            <Text style={authStyles.label}>Nom</Text>
            <TextInput
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor="#91836d"
              style={authStyles.input}
              value={name}
            />
          </View>

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
              placeholder="Choisissez un mot de passe"
              placeholderTextColor="#91836d"
              secureTextEntry
              style={authStyles.input}
              value={password}
            />
          </View>

          <View style={authStyles.fieldGroup}>
            <Text style={authStyles.label}>Confirmer le mot de passe</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPasswordConfirmation}
              placeholder="Répétez le mot de passe"
              placeholderTextColor="#91836d"
              secureTextEntry
              style={authStyles.input}
              value={passwordConfirmation}
            />
          </View>

          <Pressable
            disabled={isSubmitting}
            onPress={() => {
              void handleSignUp();
            }}
            style={[
              authStyles.primaryAction,
              isSubmitting ? authStyles.primaryActionDisabled : null,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#fffaf3" />
            ) : (
              <Text style={authStyles.primaryActionText}>Inscription</Text>
            )}
          </Pressable>

          <Link href="/sign-in" asChild>
            <Pressable style={authStyles.secondaryAction}>
              <Text style={authStyles.secondaryActionText}>
                Vous avez déjà un compte ? Connectez-vous !
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
