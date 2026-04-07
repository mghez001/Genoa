import { Drawer } from 'expo-router/drawer';

import { useSession } from '../../src/ctx';

export default function Layout() {
  const { user } = useSession();
  const canAccessModeration = user?.role === 'admin' || user?.role === 'editor';

  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Arbre',
          title: 'Arbre Généalogique',
        }}
      />
      <Drawer.Screen
        name="statistics"
        options={{
          drawerLabel: 'Statistiques',
          title: 'Statistiques',
        }}
      />
      <Drawer.Screen
        name="moderation"
        options={
          canAccessModeration
            ? {
                drawerLabel: 'Moderation',
                title: 'Moderation',
              }
            : {
                title: 'Moderation',
                drawerItemStyle: {
                  display: 'none',
                },
              }
        }
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Paramètres',
          title: 'Paramètres',
        }}
      />
      <Drawer.Screen
        name="add"
        options={{
          title: 'Ajouter',
          drawerItemStyle: {
            display: 'none',
          },
        }}
      />
    </Drawer>
  );
}
