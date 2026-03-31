import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <Drawer initialRouteName="tree">
      <Drawer.Screen
        name="tree"
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
        options={{
          drawerLabel: 'Moderation',
          title: 'Moderation',
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Paramètres',
          title: 'Paramètres',
        }}
      />
    </Drawer>
  );
}
