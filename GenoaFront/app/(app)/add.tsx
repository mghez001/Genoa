import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AuthApiError, createMember } from '../../src/authApi';
import { useSession } from '../../src/ctx';

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 5) {
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
      const message =
        createError instanceof AuthApiError
          ? createError.message
          : 'Impossible d’ajouter le membre.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Pressable
        onPress={() => router.back()}
        style={{
          alignSelf: 'flex-start',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: '#000000',
        }}
      >
        <Text>Retour</Text>
      </Pressable>

      <Text>Que voulez-vous ajouter ?</Text>

      <Pressable
        onPress={() => {
          setSelectedType('member');
          setMessage('');
          setError('');
        }}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: '#000000',
        }}
      >
        <Text>Un membre</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setSelectedType('relation');
          setMessage('');
          setError('');
        }}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: '#000000',
        }}
      >
        <Text>Une relation</Text>
      </Pressable>

      {selectedType === 'member' ? (
        <View style={{ gap: 12 }}>
          <Text>Ajout d&apos;un membre</Text>

          <View style={{ gap: 4 }}>
            <Text>Nom</Text>
            <TextInput
              value={nom}
              onChangeText={setNom}
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Prénom</Text>
            <TextInput
              value={prenom}
              onChangeText={setPrenom}
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Sexe</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setSexe('homme')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#000000',
                  backgroundColor: sexe === 'homme' ? '#dddddd' : '#ffffff',
                }}
              >
                <Text>Homme</Text>
              </Pressable>

              <Pressable
                onPress={() => setSexe('femme')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#000000',
                  backgroundColor: sexe === 'femme' ? '#dddddd' : '#ffffff',
                }}
              >
                <Text>Femme</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text>Date de naissance</Text>
            <TextInput
              value={dateNaissance}
              onChangeText={(value) => setDateNaissance(formatDateInput(value))}
              placeholder="AAAA-MM-JJ"
              keyboardType="number-pad"
              maxLength={10}
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Date de décès</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => {
                  setIsAlive(true);
                  setDateDeces('');
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#000000',
                  backgroundColor: isAlive ? '#dddddd' : '#ffffff',
                }}
              >
                <Text>Toujours en vie</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsAlive(false)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#000000',
                  backgroundColor: !isAlive ? '#dddddd' : '#ffffff',
                }}
              >
                <Text>Décédé</Text>
              </Pressable>
            </View>

            {!isAlive ? (
              <TextInput
                value={dateDeces}
                onChangeText={(value) => setDateDeces(formatDateInput(value))}
                placeholder="AAAA-MM-JJ"
                keyboardType="number-pad"
                maxLength={10}
                style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
              />
            ) : null}
          </View>

          <View style={{ gap: 4 }}>
            <Text>Photo URL</Text>
            <TextInput
              value={photoURL}
              onChangeText={setPhotoURL}
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Emails</Text>
            <TextInput
              value={emails}
              onChangeText={setEmails}
              placeholder="séparés par des virgules"
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Téléphones</Text>
            <TextInput
              value={telephones}
              onChangeText={setTelephones}
              placeholder="séparés par des virgules"
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Adresses</Text>
            <TextInput
              value={adresses}
              onChangeText={setAdresses}
              placeholder="séparées par des virgules"
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text>Professions</Text>
            <TextInput
              value={professions}
              onChangeText={setProfessions}
              placeholder="séparées par des virgules"
              style={{ borderWidth: 1, borderColor: '#000000', padding: 12 }}
            />
          </View>

          <Pressable
            onPress={() => void handleCreateMember()}
            disabled={isSubmitting}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#000000',
              backgroundColor: isSubmitting ? '#dddddd' : '#ffffff',
            }}
          >
            <Text>{isSubmitting ? 'Ajout en cours...' : 'Ajouter le membre'}</Text>
          </Pressable>

          {message ? <Text>{message}</Text> : null}
          {error ? <Text>{error}</Text> : null}
        </View>
      ) : null}

      {selectedType === 'relation' ? (
        <View>
          <Text>Le formulaire d&apos;ajout de relation sera ajouté ensuite.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
