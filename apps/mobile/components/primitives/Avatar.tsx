/**
 * primitives/Avatar.tsx
 * Circular user avatar with fallback initials + optional online/active dot.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography } from '../../utils/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
};

interface Props {
  uri?: string | null;
  initials?: string;
  size?: AvatarSize;
  /** Show a small green online indicator dot */
  online?: boolean;
  style?: ViewStyle;
}

export default function Avatar({ uri, initials = '?', size = 'md', online, style }: Props) {
  const dim = SIZE_MAP[size];
  const fontSize = dim * 0.36;

  return (
    <View style={[styles.wrap, { width: dim, height: dim, borderRadius: dim / 2 }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          contentFit="cover"
          // Warm cream placeholder so nothing ever flashes a broken frame
          placeholder={Colors.warmGrey}
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials.slice(0, 2)}</Text>
        </View>
      )}

      {online && (
        <View
          style={[
            styles.dot,
            {
              // Position dot at bottom-right of the avatar circle
              bottom: dim * 0.04,
              right: dim * 0.04,
              width: dim * 0.28,
              height: dim * 0.28,
              borderRadius: dim * 0.14,
              borderWidth: dim * 0.06,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible', // allow dot to overflow
    // Soft peach ring
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  fallback: {
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.peachDark,
  },
  dot: {
    position: 'absolute',
    backgroundColor: Colors.sentimentPositive,
    borderColor: Colors.white,
  },
});
