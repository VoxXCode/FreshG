import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Keyboard, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  primary:          '#16a34a',
  surfaceLowest:    '#ffffff',
  outlineVariant:   '#e2e8f0',
  onSurfaceVariant: '#94a3b8',
  onSurfaceActive:  '#16a34a',
};

type TabDef = {
  name: string;
  label: string;
  renderIcon: (focused: boolean, color: string) => React.ReactNode;
};

const LEFT_TABS: TabDef[] = [
  {
    name: 'index',
    label: 'Home',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
    ),
  },
  {
    name: 'stok',
    label: 'Stok',
    renderIcon: (focused, color) => (
      <MaterialCommunityIcons
        name={focused ? 'fridge' : 'fridge-outline'}
        size={23}
        color={color}
      />
    ),
  },
];

const RIGHT_TABS: TabDef[] = [
  {
    name: 'todo',
    label: 'Belanja',
    renderIcon: (focused, color) => (
      <Ionicons
        name={focused ? 'clipboard' : 'clipboard-outline'}
        size={23}
        color={color}
      />
    ),
  },
  {
    name: 'profile',
    label: 'Profile',
    renderIcon: (focused, color) => (
      <Ionicons
        name={focused ? 'person' : 'person-outline'}
        size={23}
        color={color}
      />
    ),
  },
];

type TabBarProps = { state: any; navigation: any };

export default function BottomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [anim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [anim]);

  const currentRouteName = state.routes[state.index]?.name;
  if (
    currentRouteName === 'login' ||
    currentRouteName === 'scan' ||
    currentRouteName === 'notifikasi' ||
    currentRouteName === 'setting-notifikasi'
  ) {
    return null;
  }

  const renderTabButton = (tabDef: TabDef) => {
    const focused = currentRouteName === tabDef.name;
    const color = focused ? C.onSurfaceActive : C.onSurfaceVariant;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: tabDef.name,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(tabDef.name);
      }
    };

    return (
      <TouchableOpacity
        key={tabDef.name}
        onPress={onPress}
        activeOpacity={0.7}
        style={s.tab}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
      >
        {tabDef.renderIcon(focused, color)}
        <Text style={[s.label, { color, fontWeight: focused ? '700' : '500' }]}>
          {tabDef.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 14);

  return (
    <Animated.View
      style={[
        s.wrapper,
        {
          paddingBottom: bottomInset,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents={isKeyboardVisible ? 'none' : 'auto'}
    >
      <View style={s.container}>
        <View style={s.tabGroup}>
          {LEFT_TABS.map(renderTabButton)}
        </View>

        <View style={s.fabWrapper}>
          <TouchableOpacity
            style={s.fabOuter}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('scan')}
            accessibilityRole="button"
            accessibilityLabel="Scan Kamera"
          >
            <View style={s.fabInner}>
              <MaterialCommunityIcons name="camera" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.tabGroup}>
          {RIGHT_TABS.map(renderTabButton)}
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 56,
    gap: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    zIndex: 10,
    paddingHorizontal: 6,
  },
  fabOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  fabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
