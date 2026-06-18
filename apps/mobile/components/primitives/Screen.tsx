/**
 * primitives/Screen.tsx
 * Root wrapper for every screen — safe area, background, optional padding.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../utils/theme';

interface Props {
  children: React.ReactNode;
  /** Background colour — defaults to offWhite */
  bg?: string;
  /** Add horizontal screen padding (default true) */
  padded?: boolean;
  /** Extra style overrides */
  style?: ViewStyle;
}

export default function Screen({ children, bg = Colors.offWhite, padded = true, style }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingHorizontal: padded ? Spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
