import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AuthApiError, createMember } from '../../src/api';
import { appColors, appStyles } from '../../src/appStyles';
import { useSession } from '../../src/ctx';

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Add() {
  const router = useRouter();
  const { session, user } = useSession();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [dateDeces, setDateDeces] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [photoURL, setPhotoURL] = useState('');
  const [emails, setEmails] = useState('');
  const [telephones, setTelephones] = useState('');
  const [adresses, setAdresses] = useState('');
  const [professions, setProfessions] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canAddElement = user?.role === 'admin' || user?.role === 'editor';

  if (!canAddElement) {
    return <Redirect href="/(app)" />;
  }

  const resetMemberForm = () => {
    setNom('');
    setPrenom('');
    setSexe('');
    setDateNaissance('');
    setDateDeces('');
    setIsAlive(true);
    setPhotoURL('');
    setEmails('');
    setTelephones('');
    setAdresses('');
    setProfessions('');
  };

  const handleCreateMember = async () => {
    if (!session) {
      setError('Vous devez être connecté.');
      setMessage('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await createMember(session, {
        nom: nom.trim(),
        prenom: prenom.trim(),
        sexe: sexe || undefined,
        dateNaissance: dateNaissance || undefined,
        dateDeces: isAlive ? undefined : dateDeces || undefined,
        photoURL: photoURL.trim() || undefined,
        emails: parseList(emails),
        telephones: parseList(telephones),
        adresses: parseList(adresses),
        professions: parseList(professions),
      });

      setMessage(response.message);
      resetMemberForm();
    } catch (createError) {
      const memberMessage =
        createError instanceof AuthApiError
          ? createError.message
          : 'Impossible d’ajouter le membre.';

      setError(memberMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={appStyles.pageScreen} contentContainerStyle={appStyles.pageContent}>
      <Pressable onPress={() => router.back()} style={appStyles.ghostButton}>
        <Text style={appStyles.ghostButtonText}>Retour</Text>
      </Pressable>

      <View style={appStyles.pageHeader}>
        <Text style={appStyles.title}>Ajouter</Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Type d&apos;élément</Text>

        <View style={appStyles.row}>
          <Pressable
            onPress={() => {
              setSelectedType('member');
              setMessage('');
              setError('');
            }}
            style={[
              appStyles.secondaryButton,
              selectedType === 'member' ? appStyles.secondaryButtonSelected : null,
            ]}>
            <Text style={appStyles.secondaryButtonText}>Un membre</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setSelectedType('relation');
              setMessage('');
              setError('');
            }}
            style={[
              appStyles.secondaryButton,
              selectedType === 'relation' ? appStyles.secondaryButtonSelected : null,
            ]}>
            <Text style={appStyles.secondaryButtonText}>Une relation</Text>
          </Pressable>
        </View>
      </View>

      {selectedType === 'member' ? (
        <View style={appStyles.card}>
          <Text style={appStyles.cardTitle}>Ajout d&apos;un membre</Text>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Nom</Text>
            <TextInput value={nom} onChangeText={setNom} style={appStyles.input} />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Prénom</Text>
            <TextInput value={prenom} onChangeText={setPrenom} style={appStyles.input} />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Sexe</Text>
            <View style={appStyles.row}>
              <Pressable
                onPress={() => setSexe('homme')}
                style={[
                  appStyles.secondaryButton,
                  sexe === 'homme' ? appStyles.secondaryButtonSelected : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Homme</Text>
              </Pressable>

              <Pressable
                onPress={() => setSexe('femme')}
                style={[
                  appStyles.secondaryButton,
                  sexe === 'femme' ? appStyles.secondaryButtonSelected : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Femme</Text>
              </Pressable>
            </View>
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Date de naissance</Text>
            <TextInput
              value={dateNaissance}
              onChangeText={(value) => setDateNaissance(formatDateInput(value))}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={appColors.muted}
              keyboardType="number-pad"
              maxLength={10}
              style={appStyles.input}
            />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Date de décès</Text>
            <View style={appStyles.row}>
              <Pressable
                onPress={() => {
                  setIsAlive(true);
                  setDateDeces('');
                }}
                style={[
                  appStyles.secondaryButton,
                  isAlive ? appStyles.secondaryButtonSelected : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Toujours en vie</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsAlive(false)}
                style={[
                  appStyles.secondaryButton,
                  !isAlive ? appStyles.secondaryButtonSelected : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Décédé</Text>
              </Pressable>
            </View>

            {!isAlive ? (
              <TextInput
                value={dateDeces}
                onChangeText={(value) => setDateDeces(formatDateInput(value))}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={appColors.muted}
                keyboardType="number-pad"
                maxLength={10}
                style={appStyles.input}
              />
            ) : null}
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Photo URL</Text>
            <TextInput value={photoURL} onChangeText={setPhotoURL} style={appStyles.input} />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Emails</Text>
            <TextInput
              value={emails}
              onChangeText={setEmails}
              placeholder="séparés par des virgules"
              placeholderTextColor={appColors.muted}
              style={appStyles.input}
            />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Téléphones</Text>
            <TextInput
              value={telephones}
              onChangeText={setTelephones}
              placeholder="séparés par des virgules"
              placeholderTextColor={appColors.muted}
              style={appStyles.input}
            />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Adresses</Text>
            <TextInput
              value={adresses}
              onChangeText={setAdresses}
              placeholder="séparées par des virgules"
              placeholderTextColor={appColors.muted}
              style={appStyles.input}
            />
          </View>

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Professions</Text>
            <TextInput
              value={professions}
              onChangeText={setProfessions}
              placeholder="séparées par des virgules"
              placeholderTextColor={appColors.muted}
              style={appStyles.input}
            />
          </View>

          <Pressable
            onPress={() => {
              void handleCreateMember();
            }}
            disabled={isSubmitting}
            style={[
              appStyles.primaryButton,
              isSubmitting ? appStyles.primaryButtonDisabled : null,
            ]}>
            <Text style={appStyles.primaryButtonText}>
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter le membre'}
            </Text>
          </Pressable>

          {message ? (
            <View style={[appStyles.messageBox, appStyles.infoMessage]}>
              <Text style={appStyles.messageText}>{message}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={[appStyles.messageBox, appStyles.errorMessage]}>
              <Text style={appStyles.messageText}>{error}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {selectedType === 'relation' ? (
        <View style={appStyles.card}>
          <Text style={appStyles.cardTitle}>Ajout d'une relation</Text>
          <Text style={appStyles.itemText}>
            Le formulaire d'ajout de relation sera ajouté ensuite.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
