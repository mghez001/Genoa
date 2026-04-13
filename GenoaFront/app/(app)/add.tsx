import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  AuthApiError,
  createChildRelation,
  createCouple,
  createMember,
  getCouples,
  getMembers,
} from '../../src/api';
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

function getMemberLabel(member: any) {
  const name = [member.prenom, member.nom].filter(Boolean).join(' ');
  return name || member._id;
}

function getCoupleLabel(couple: any) {
  const member1 = getMemberLabel(couple.membre1_id ?? {});
  const member2 = getMemberLabel(couple.membre2_id ?? {});

  return `${member1} + ${member2}`;
}

function getMemberId(value: any) {
  return typeof value === 'string' ? value : value?._id;
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
  const [relationKind, setRelationKind] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [couples, setCouples] = useState<any[]>([]);
  const [selectedMember1Id, setSelectedMember1Id] = useState('');
  const [selectedMember2Id, setSelectedMember2Id] = useState('');
  const [selectedCoupleId, setSelectedCoupleId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [dateUnion, setDateUnion] = useState('');
  const [dateSeparation, setDateSeparation] = useState('');
  const [isCoupleSeparated, setIsCoupleSeparated] = useState(false);
  const [filiationType, setFiliationType] = useState('biologique');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRelationLoading, setIsRelationLoading] = useState(false);
  const canAddElement = user?.role === 'admin' || user?.role === 'editor';
  const selectedCouple = couples.find((couple: any) => couple._id === selectedCoupleId);
  const selectedCoupleMemberIds = [
    getMemberId(selectedCouple?.membre1_id),
    getMemberId(selectedCouple?.membre2_id),
  ].filter(Boolean);
  const availableChildren = selectedCouple
    ? members.filter((member: any) => !selectedCoupleMemberIds.includes(member._id))
    : members;

  useEffect(() => {
    if (!session || selectedType !== 'relation') {
      return;
    }

    let isCancelled = false;

    const loadRelationData = async () => {
      setIsRelationLoading(true);
      setError('');

      try {
        const [membersResponse, couplesResponse] = await Promise.all([
          getMembers(session, '?limit=1000'),
          getCouples(session),
        ]);

        if (isCancelled) {
          return;
        }

        setMembers(membersResponse.data.members);
        setCouples(couplesResponse.data.couples);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        const relationMessage =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Impossible de charger les données pour les relations.';

        setError(relationMessage);
      } finally {
        if (!isCancelled) {
          setIsRelationLoading(false);
        }
      }
    };

    void loadRelationData();

    return () => {
      isCancelled = true;
    };
  }, [selectedType, session]);

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

  const resetRelationForm = () => {
    setRelationKind(null);
    setSelectedMember1Id('');
    setSelectedMember2Id('');
    setSelectedCoupleId('');
    setSelectedChildId('');
    setDateUnion('');
    setDateSeparation('');
    setIsCoupleSeparated(false);
    setFiliationType('biologique');
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

  const handleCreateCouple = async () => {
    if (!session) {
      setError('Vous devez être connecté.');
      setMessage('');
      return;
    }

    if (!selectedMember1Id || !selectedMember2Id) {
      setError('Sélectionnez les deux membres du couple.');
      setMessage('');
      return;
    }

    if (selectedMember1Id === selectedMember2Id) {
      setError('Un couple doit contenir deux membres différents.');
      setMessage('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await createCouple(session, {
        membre1_id: selectedMember1Id,
        membre2_id: selectedMember2Id,
        dateUnion: dateUnion || undefined,
        dateSeparation: isCoupleSeparated ? dateSeparation || undefined : undefined,
      });

      setMessage(response.message);
      resetRelationForm();

      const couplesResponse = await getCouples(session);
      setCouples(couplesResponse.data.couples);
    } catch (createError) {
      const relationMessage =
        createError instanceof AuthApiError
          ? createError.message
          : 'Impossible de créer le couple.';

      setError(relationMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChildRelation = async () => {
    if (!session) {
      setError('Vous devez être connecté.');
      setMessage('');
      return;
    }

    if (!selectedCoupleId || !selectedChildId) {
      setError('Sélectionnez un couple et un enfant.');
      setMessage('');
      return;
    }

    if (selectedCoupleMemberIds.includes(selectedChildId)) {
      setError("L'enfant ne peut pas être un des membres du couple.");
      setMessage('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await createChildRelation(session, {
        couple_id: selectedCoupleId,
        enfant_id: selectedChildId,
        filiationType,
      });

      setMessage(response.message);
      resetRelationForm();
    } catch (createError) {
      const relationMessage =
        createError instanceof AuthApiError
          ? createError.message
          : 'Impossible de créer le lien couple/enfant.';

      setError(relationMessage);
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
              resetRelationForm();
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
          <Text style={appStyles.cardTitle}>Ajout d&apos;une relation</Text>

          {isRelationLoading ? <Text style={appStyles.itemText}>Chargement...</Text> : null}

          <View style={appStyles.fieldGroup}>
            <Text style={appStyles.label}>Type de relation</Text>
            <View style={appStyles.row}>
              <Pressable
                onPress={() => setRelationKind('couple')}
                style={[
                  appStyles.secondaryButton,
                  relationKind === 'couple' ? appStyles.secondaryButtonSelected : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Couple</Text>
              </Pressable>

              <Pressable
                onPress={() => setRelationKind('child')}
                style={[
                  appStyles.secondaryButton,
                  relationKind === 'child' ? appStyles.secondaryButtonSelected : null,
                ]}>
                <Text style={appStyles.secondaryButtonText}>Couple / enfant</Text>
              </Pressable>
            </View>
          </View>

          {relationKind === 'couple' ? (
            <>
              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Premier membre</Text>
                {members.length === 0 ? <Text style={appStyles.itemText}>Aucun membre disponible.</Text> : null}
                {members.map((member: any) => (
                  <Pressable
                    key={member._id}
                    onPress={() => setSelectedMember1Id(member._id)}
                    style={[
                      appStyles.listItem,
                      selectedMember1Id === member._id ? appStyles.listItemSelected : null,
                    ]}>
                    <Text style={appStyles.itemTitle}>{getMemberLabel(member)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Deuxième membre</Text>
                {members.length === 0 ? <Text style={appStyles.itemText}>Aucun membre disponible.</Text> : null}
                {members.map((member: any) => (
                  <Pressable
                    key={member._id}
                    onPress={() => setSelectedMember2Id(member._id)}
                    style={[
                      appStyles.listItem,
                      selectedMember2Id === member._id ? appStyles.listItemSelected : null,
                    ]}>
                    <Text style={appStyles.itemTitle}>{getMemberLabel(member)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Date d&apos;union</Text>
                <TextInput
                  value={dateUnion}
                  onChangeText={(value) => setDateUnion(formatDateInput(value))}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={appColors.muted}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={appStyles.input}
                />
              </View>

              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Séparation</Text>
                <View style={appStyles.row}>
                  <Pressable
                    onPress={() => {
                      setIsCoupleSeparated(false);
                      setDateSeparation('');
                    }}
                    style={[
                      appStyles.secondaryButton,
                      !isCoupleSeparated ? appStyles.secondaryButtonSelected : null,
                    ]}>
                    <Text style={appStyles.secondaryButtonText}>Toujours ensemble</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIsCoupleSeparated(true)}
                    style={[
                      appStyles.secondaryButton,
                      isCoupleSeparated ? appStyles.secondaryButtonSelected : null,
                    ]}>
                    <Text style={appStyles.secondaryButtonText}>Séparés</Text>
                  </Pressable>
                </View>

                {isCoupleSeparated ? (
                  <TextInput
                    value={dateSeparation}
                    onChangeText={(value) => setDateSeparation(formatDateInput(value))}
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={appColors.muted}
                    keyboardType="number-pad"
                    maxLength={10}
                    style={appStyles.input}
                  />
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  void handleCreateCouple();
                }}
                disabled={isSubmitting}
                style={[
                  appStyles.primaryButton,
                  isSubmitting ? appStyles.primaryButtonDisabled : null,
                ]}>
                <Text style={appStyles.primaryButtonText}>
                  {isSubmitting ? 'Ajout en cours...' : 'Créer le couple'}
                </Text>
              </Pressable>
            </>
          ) : null}

          {relationKind === 'child' ? (
            <>
              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Couple</Text>
                {couples.length === 0 ? <Text style={appStyles.itemText}>Aucun couple disponible.</Text> : null}
                {couples.map((couple: any) => (
                  <Pressable
                    key={couple._id}
                    onPress={() => {
                      setSelectedCoupleId(couple._id);
                      setSelectedChildId('');
                    }}
                    style={[
                      appStyles.listItem,
                      selectedCoupleId === couple._id ? appStyles.listItemSelected : null,
                    ]}>
                    <Text style={appStyles.itemTitle}>{getCoupleLabel(couple)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Enfant</Text>
                {selectedCouple ? (
                  <Text style={appStyles.itemText}>
                    Les deux membres du couple sélectionné sont exclus de cette liste.
                  </Text>
                ) : null}
                {availableChildren.length === 0 ? (
                  <Text style={appStyles.itemText}>Aucun enfant disponible.</Text>
                ) : null}
                {availableChildren.map((member: any) => (
                  <Pressable
                    key={member._id}
                    onPress={() => setSelectedChildId(member._id)}
                    style={[
                      appStyles.listItem,
                      selectedChildId === member._id ? appStyles.listItemSelected : null,
                    ]}>
                    <Text style={appStyles.itemTitle}>{getMemberLabel(member)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={appStyles.fieldGroup}>
                <Text style={appStyles.label}>Type de filiation</Text>
                <View style={appStyles.row}>
                  <Pressable
                    onPress={() => setFiliationType('biologique')}
                    style={[
                      appStyles.secondaryButton,
                      filiationType === 'biologique' ? appStyles.secondaryButtonSelected : null,
                    ]}>
                    <Text style={appStyles.secondaryButtonText}>Biologique</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setFiliationType('adoption')}
                    style={[
                      appStyles.secondaryButton,
                      filiationType === 'adoption' ? appStyles.secondaryButtonSelected : null,
                    ]}>
                    <Text style={appStyles.secondaryButtonText}>Adoption</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  void handleCreateChildRelation();
                }}
                disabled={isSubmitting}
                style={[
                  appStyles.primaryButton,
                  isSubmitting ? appStyles.primaryButtonDisabled : null,
                ]}>
                <Text style={appStyles.primaryButtonText}>
                  {isSubmitting ? 'Ajout en cours...' : 'Créer le lien couple/enfant'}
                </Text>
              </Pressable>
            </>
          ) : null}

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
    </ScrollView>
  );
}
