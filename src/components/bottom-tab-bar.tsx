/**
 * Custom Bottom Tab Bar – FreshG
 * Matches the Material 3 pill-style nav from the HTML reference design.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  secondaryContainer:   '#82f5c1',
  onSecondaryContainer: '#00714e',
  surfaceLowest:        '#ffffff',
  outlineVariant:       '#bbcabf',
  onSurfaceVariant:     '#3c4a42',
};

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabDef = {
  name: string;
  label: string;
  renderIcon: (focused: boolean, color: string) => React.ReactNode;
};

const TABS: TabDef[] = [
  {
    name: 'index',
    label: 'Beranda',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
    ),
  },
  {
    name: 'stok',
    label: 'Stok Bahan',
    renderIcon: (focused, color) => (
      <MaterialCommunityIcons
        name={focused ? 'clipboard-list' : 'clipboard-list-outline'}
        size={22}
        color={color}
      />
    ),
  },
  {
    name: 'tips',
    label: 'Tips & Resep',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'bulb' : 'bulb-outline'} size={22} color={color} />
    ),
  },
  {
    name: 'pengaturan',
    label: 'Pengaturan',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
    ),
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

// Using `any` for navigation to avoid importing @react-navigation/bottom-tabs
// just for its complex generic types, which aren't installed in this project.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TabBarProps = { state: any; navigation: any };

// ── Component ─────────────────────────────────────────────────────────────────

export default function BottomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  // Only render routes that appear in our TABS definition (hides 'explore' etc.)
  const visibleRoutes = (state.routes as Array<{ key: string; name: string }>).filter(
    r => TABS.some(t => t.name === r.name),
  );

  return (
    <View style={[s.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {visibleRoutes.map(route => {
        const tabDef  = TABS.find(t => t.name === route.name)!;
        const focused = state.routes[state.index]?.name === route.name;
        const color   = focused ? C.onSecondaryContainer : C.onSurfaceVariant;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.85}
            style={[s.tab, focused && s.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
          >
            {tabDef.renderIcon(focused, color)}
            <Text style={[s.label, { color }]}>{tabDef.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: C.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: C.secondaryContainer,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  }
});
