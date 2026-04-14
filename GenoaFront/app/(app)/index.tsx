import { Graph, layout } from '@dagrejs/dagre';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AuthApiError,
  deleteMember,
  getChildRelations,
  getCouples,
  getMembers,
  updateMember,
} from '../../src/api';
import { appColors, appStyles } from '../../src/appStyles';
import { useSession } from '../../src/ctx';

const MEMBER_WIDTH = 132;
const MEMBER_HEIGHT = 64;
const COUPLE_GAP = 36;
const COUPLE_WIDTH = MEMBER_WIDTH * 2 + COUPLE_GAP;
const COUPLE_HEIGHT = 76;
const CANVAS_PADDING = 32;

function getId(value: any) {
  return typeof value === 'string' ? value : value?._id;
}

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

function formatDateForInput(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatList(value: string[] | null | undefined) {
  return value?.join(', ') ?? '';
}

function getMemberLabel(member: any) {
  const name = [member?.prenom, member?.nom].filter(Boolean).join(' ');
  return name || 'Membre';
}

function getMemberInfo(member: any) {
  if (!member?.dateNaissance) {
    return '';
  }

  return new Date(member.dateNaissance).getFullYear().toString();
}

function memberCard(member: any, onPress?: (member: any) => void, isSelected = false) {
  const genderStyle =
    member?.sexe === 'homme'
      ? appStyles.treeMemberCardMale
      : member?.sexe === 'femme'
        ? appStyles.treeMemberCardFemale
        : null;
  const card = (
    <View
      style={[
        appStyles.treeMemberCard,
        genderStyle,
        isSelected ? appStyles.treeMemberCardSelected : null,
      ]}>
      <Text numberOfLines={2} style={appStyles.treeMemberName}>
        {getMemberLabel(member)}
      </Text>
      {getMemberInfo(member) ? (
        <Text style={appStyles.treeMemberInfo}>{getMemberInfo(member)}</Text>
      ) : null}
    </View>
  );

  if (!onPress) {
    return card;
  }

  return (
    <Pressable onPress={() => onPress(member)}>
      {card}
    </Pressable>
  );
}

function coupleLink(isSeparated: boolean) {
  return (
    <View
      style={[
        appStyles.treeCoupleLink,
        {
          backgroundColor: isSeparated ? appColors.coupleSeparated : appColors.coupleActive,
        },
      ]}
    />
  );
}

function buildTree(members: any[], couples: any[], childRelations: any[]) {
  const memberById = new Map(members.map((member: any) => [member._id, member]));
  const coupleById = new Map(couples.map((couple: any) => [couple._id, couple]));
  const memberNodeById = new Map();
  const nodes: any[] = [];
  const edges: any[] = [];

  couples.forEach((couple: any) => {
    const nodeId = `couple:${couple._id}`;
    const member1Id = getId(couple.membre1_id);
    const member2Id = getId(couple.membre2_id);
    const coupleWithFullMembers = {
      ...couple,
      membre1_id: memberById.get(member1Id) ?? couple.membre1_id,
      membre2_id: memberById.get(member2Id) ?? couple.membre2_id,
    };

    nodes.push({
      id: nodeId,
      type: 'couple',
      couple: coupleWithFullMembers,
      width: COUPLE_WIDTH,
      height: COUPLE_HEIGHT,
    });

    if (!memberNodeById.has(member1Id)) {
      memberNodeById.set(member1Id, nodeId);
    }

    if (!memberNodeById.has(member2Id)) {
      memberNodeById.set(member2Id, nodeId);
    }
  });

  members.forEach((member: any) => {
    if (memberNodeById.has(member._id)) {
      return;
    }

    const nodeId = `member:${member._id}`;
    memberNodeById.set(member._id, nodeId);
    nodes.push({
      id: nodeId,
      type: 'member',
      member,
      width: MEMBER_WIDTH,
      height: MEMBER_HEIGHT,
    });
  });

  childRelations.forEach((relation: any) => {
    const coupleId = getId(relation.couple_id);
    const childId = getId(relation.enfant_id);
    const sourceNodeId = coupleById.has(coupleId) ? `couple:${coupleId}` : null;
    const targetNodeId = memberNodeById.get(childId);

    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) {
      return;
    }

    edges.push({
      source: sourceNodeId,
      target: targetNodeId,
      childId,
    });
  });

  const graph = new Graph();
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 70,
    ranksep: 90,
    marginx: CANVAS_PADDING,
    marginy: CANVAS_PADDING,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: node.width,
      height: node.height,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  layout(graph);

  const positionedNodes = nodes.map((node) => {
    const layoutNode = graph.node(node.id);

    return {
      ...node,
      x: layoutNode.x - node.width / 2,
      y: layoutNode.y - node.height / 2,
    };
  });

  const nodeById = new Map(positionedNodes.map((node) => [node.id, node]));
  const graphSize = graph.graph();

  return {
    nodes: positionedNodes,
    edges: edges
      .map((edge) => ({
        ...edge,
        sourceNode: nodeById.get(edge.source),
        targetNode: nodeById.get(edge.target),
      }))
      .filter((edge) => edge.sourceNode && edge.targetNode),
    width: Math.max((graphSize.width ?? 0) + CANVAS_PADDING * 2, 320),
    height: Math.max((graphSize.height ?? 0) + CANVAS_PADDING * 2, 520),
  };
}

function lineStyle(x: number, y: number, width: number, height: number) {
  return {
    left: x,
    top: y,
    width,
    height,
  };
}

async function loadTreeData(session: string) {
  const [membersResponse, couplesResponse, childrenResponse] = await Promise.all([
    getMembers(session, '?limit=1000'),
    getCouples(session),
    getChildRelations(session),
  ]);

  return {
    members: membersResponse.data.members,
    couples: couplesResponse.data.couples,
    children: childrenResponse.data.children,
  };
}

export default function Index() {
  const router = useRouter();
  const { session, user } = useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [couples, setCouples] = useState<any[]>([]);
  const [childRelations, setChildRelations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editSexe, setEditSexe] = useState('');
  const [editDateNaissance, setEditDateNaissance] = useState('');
  const [editDateDeces, setEditDateDeces] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editEmails, setEditEmails] = useState('');
  const [editTelephones, setEditTelephones] = useState('');
  const [editAdresses, setEditAdresses] = useState('');
  const [editProfessions, setEditProfessions] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const canAddElement = user?.role === 'admin' || user?.role === 'editor';
  const tree = buildTree(members, couples, childRelations);

  const refreshTree = async () => {
    if (!session) {
      return;
    }

    const treeData = await loadTreeData(session);
    setMembers(treeData.members);
    setCouples(treeData.couples);
    setChildRelations(treeData.children);
  };

  const selectMember = (member: any) => {
    if (!canAddElement) {
      return;
    }

    setSelectedMember(member);
    setEditNom(member.nom ?? '');
    setEditPrenom(member.prenom ?? '');
    setEditSexe(member.sexe ?? '');
    setEditDateNaissance(formatDateForInput(member.dateNaissance));
    setEditDateDeces(formatDateForInput(member.dateDeces));
    setEditPhotoURL(member.photoURL ?? '');
    setEditEmails(formatList(member.emails));
    setEditTelephones(formatList(member.telephones));
    setEditAdresses(formatList(member.adresses));
    setEditProfessions(formatList(member.professions));
    setEditMessage('');
    setEditError('');
    setIsConfirmingDelete(false);
  };

  const closeMemberPanel = () => {
    setSelectedMember(null);
    setEditMessage('');
    setEditError('');
    setIsConfirmingDelete(false);
  };

  const handleUpdateMember = async () => {
    if (!session || !selectedMember) {
      return;
    }

    setIsEditingMember(true);
    setEditMessage('');
    setEditError('');

    try {
      const response = await updateMember(session, selectedMember._id, {
        nom: editNom.trim(),
        prenom: editPrenom.trim(),
        sexe: editSexe || undefined,
        dateNaissance: editDateNaissance || null,
        dateDeces: editDateDeces || null,
        photoURL: editPhotoURL.trim() || undefined,
        emails: parseList(editEmails),
        telephones: parseList(editTelephones),
        adresses: parseList(editAdresses),
        professions: parseList(editProfessions),
      });

      setSelectedMember(response.data.member);
      setEditMessage(response.message);
      await refreshTree();
    } catch (updateError) {
      const message =
        updateError instanceof AuthApiError
          ? updateError.message
          : 'Impossible de modifier ce membre.';

      setEditError(message);
    } finally {
      setIsEditingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!session || !selectedMember) {
      return;
    }

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setEditMessage('');
      setEditError('Cliquez encore sur confirmer pour supprimer ce membre et ses liens.');
      return;
    }

    setIsDeletingMember(true);
    setEditMessage('');
    setEditError('');

    try {
      await deleteMember(session, selectedMember._id);
      closeMemberPanel();
      await refreshTree();
    } catch (deleteError) {
      const message =
        deleteError instanceof AuthApiError
          ? deleteError.message
          : 'Impossible de supprimer ce membre.';

      setEditError(message);
    } finally {
      setIsDeletingMember(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setMembers([]);
      setCouples([]);
      setChildRelations([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadTree = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const treeData = await loadTreeData(session);

        if (isCancelled) {
          return;
        }

        setMembers(treeData.members);
        setCouples(treeData.couples);
        setChildRelations(treeData.children);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Impossible de charger l’arbre.';

        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTree();

    return () => {
      isCancelled = true;
    };
  }, [session]);

  return (
    <View style={appStyles.pageScreen}>
      {isLoading ? (
        <View style={[appStyles.card, appStyles.treeEmptyCard]}>
          <Text style={appStyles.itemText}>Chargement...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[appStyles.messageBox, appStyles.errorMessage, appStyles.treeEmptyCard]}>
          <Text style={appStyles.messageText}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView horizontal style={appStyles.treeViewport}>
          <ScrollView>
            <View style={[appStyles.treeCanvas, { width: tree.width, height: tree.height }]}>
              {tree.edges.map((edge: any) => {
                const sourceX = edge.sourceNode.x + edge.sourceNode.width / 2;
                const sourceY = edge.sourceNode.y + MEMBER_HEIGHT / 2;
                let targetX = edge.targetNode.x + edge.targetNode.width / 2;
                const targetY = edge.targetNode.y;
                const midY = sourceY + Math.max(28, (targetY - sourceY) / 2);

                if (edge.targetNode.type === 'couple') {
                  const targetMember1Id = getId(edge.targetNode.couple.membre1_id);
                  const targetMember2Id = getId(edge.targetNode.couple.membre2_id);

                  if (edge.childId === targetMember1Id) {
                    targetX = edge.targetNode.x + MEMBER_WIDTH / 2;
                  }

                  if (edge.childId === targetMember2Id) {
                    targetX = edge.targetNode.x + MEMBER_WIDTH + COUPLE_GAP + MEMBER_WIDTH / 2;
                  }
                }

                return (
                  <View key={`${edge.source}-${edge.target}`}>
                    <View
                      style={[
                        appStyles.treeLine,
                        lineStyle(sourceX, sourceY, 2, Math.max(2, midY - sourceY)),
                      ]}
                    />
                    <View
                      style={[
                        appStyles.treeLine,
                        lineStyle(Math.min(sourceX, targetX), midY, Math.abs(targetX - sourceX), 2),
                      ]}
                    />
                    <View
                      style={[
                        appStyles.treeLine,
                        lineStyle(targetX, midY, 2, Math.max(2, targetY - midY)),
                      ]}
                    />
                  </View>
                );
              })}

              {tree.nodes.map((node: any) => {
                if (node.type === 'couple') {
                  const member1 = node.couple.membre1_id;
                  const member2 = node.couple.membre2_id;
                  const isSeparated = Boolean(node.couple.isSeparated || node.couple.dateSeparation);

                  return (
                    <View
                      key={node.id}
                      style={[
                        appStyles.treeNode,
                        {
                          left: node.x,
                          top: node.y,
                          width: node.width,
                          height: node.height,
                        },
                      ]}>
                      <View style={appStyles.treeCoupleRow}>
                        {memberCard(
                          member1,
                          canAddElement ? selectMember : undefined,
                          selectedMember?._id === getId(member1)
                        )}
                        {coupleLink(isSeparated)}
                        {memberCard(
                          member2,
                          canAddElement ? selectMember : undefined,
                          selectedMember?._id === getId(member2)
                        )}
                      </View>
                    </View>
                  );
                }

                return (
                  <View
                    key={node.id}
                    style={[
                      appStyles.treeNode,
                      {
                        left: node.x,
                        top: node.y,
                        width: node.width,
                        height: node.height,
                      },
                    ]}>
                    {memberCard(
                      node.member,
                      canAddElement ? selectMember : undefined,
                      selectedMember?._id === getId(node.member)
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      ) : null}

      {canAddElement && selectedMember ? (
        <View style={appStyles.memberEditPanel}>
          <ScrollView contentContainerStyle={appStyles.memberEditContent}>
            <View style={appStyles.row}>
              <Text style={appStyles.cardTitle}>Modifier le membre</Text>
              <Pressable onPress={closeMemberPanel} style={appStyles.ghostButton}>
                <Text style={appStyles.ghostButtonText}>Fermer</Text>
              </Pressable>
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Nom</Text>
              <TextInput value={editNom} onChangeText={setEditNom} style={appStyles.input} />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Prénom</Text>
              <TextInput value={editPrenom} onChangeText={setEditPrenom} style={appStyles.input} />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Sexe</Text>
              <View style={appStyles.row}>
                <Pressable
                  onPress={() => setEditSexe('homme')}
                  style={[
                    appStyles.secondaryButton,
                    editSexe === 'homme' ? appStyles.secondaryButtonSelected : null,
                  ]}>
                  <Text style={appStyles.secondaryButtonText}>Homme</Text>
                </Pressable>

                <Pressable
                  onPress={() => setEditSexe('femme')}
                  style={[
                    appStyles.secondaryButton,
                    editSexe === 'femme' ? appStyles.secondaryButtonSelected : null,
                  ]}>
                  <Text style={appStyles.secondaryButtonText}>Femme</Text>
                </Pressable>
              </View>
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Date de naissance</Text>
              <TextInput
                value={editDateNaissance}
                onChangeText={(value) => setEditDateNaissance(formatDateInput(value))}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={appColors.muted}
                keyboardType="number-pad"
                maxLength={10}
                style={appStyles.input}
              />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Date de décès</Text>
              <TextInput
                value={editDateDeces}
                onChangeText={(value) => setEditDateDeces(formatDateInput(value))}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={appColors.muted}
                keyboardType="number-pad"
                maxLength={10}
                style={appStyles.input}
              />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Photo URL</Text>
              <TextInput value={editPhotoURL} onChangeText={setEditPhotoURL} style={appStyles.input} />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Emails</Text>
              <TextInput
                value={editEmails}
                onChangeText={setEditEmails}
                placeholder="séparés par des virgules"
                placeholderTextColor={appColors.muted}
                style={appStyles.input}
              />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Téléphones</Text>
              <TextInput
                value={editTelephones}
                onChangeText={setEditTelephones}
                placeholder="séparés par des virgules"
                placeholderTextColor={appColors.muted}
                style={appStyles.input}
              />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Adresses</Text>
              <TextInput
                value={editAdresses}
                onChangeText={setEditAdresses}
                placeholder="séparées par des virgules"
                placeholderTextColor={appColors.muted}
                style={appStyles.input}
              />
            </View>

            <View style={appStyles.fieldGroup}>
              <Text style={appStyles.label}>Professions</Text>
              <TextInput
                value={editProfessions}
                onChangeText={setEditProfessions}
                placeholder="séparées par des virgules"
                placeholderTextColor={appColors.muted}
                style={appStyles.input}
              />
            </View>

            <Pressable
              onPress={() => {
                void handleUpdateMember();
              }}
              disabled={isEditingMember || isDeletingMember}
              style={[
                appStyles.primaryButton,
                isEditingMember || isDeletingMember ? appStyles.primaryButtonDisabled : null,
              ]}>
              <Text style={appStyles.primaryButtonText}>
                {isEditingMember ? 'Modification...' : 'Modifier le membre'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void handleDeleteMember();
              }}
              disabled={isEditingMember || isDeletingMember}
              style={[
                appStyles.dangerButton,
                isEditingMember || isDeletingMember ? appStyles.primaryButtonDisabled : null,
              ]}>
              <Text style={appStyles.dangerButtonText}>
                {isDeletingMember
                  ? 'Suppression...'
                  : isConfirmingDelete
                    ? 'Confirmer la suppression'
                    : 'Supprimer le membre'}
              </Text>
            </Pressable>

            {editMessage ? (
              <View style={[appStyles.messageBox, appStyles.infoMessage]}>
                <Text style={appStyles.messageText}>{editMessage}</Text>
              </View>
            ) : null}

            {editError ? (
              <View style={[appStyles.messageBox, appStyles.errorMessage]}>
                <Text style={appStyles.messageText}>{editError}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}

      {canAddElement ? (
        <Pressable
          onPress={() => router.push('/(app)/add')}
          style={appStyles.floatingButton}>
          <Text style={appStyles.floatingButtonText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
