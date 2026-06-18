/**
 * primitives/SkeletonBlock.tsx
 * Single shimmer block — compose these to build screen-specific skeletons.
 * Uses Moti's Skeleton primitive (requires expo-linear-gradient).
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import { Skeleton } from 'moti/skeleton';

// Warm, brand-consistent shimmer gradient
const SHIMMER_COLORS: [string, string] = ['#f2eae5', '#e6dbd5'];

interface Props {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export default function SkeletonBlock({ width, height, radius = 8, style }: Props) {
  return (
    <Skeleton
      colorMode="light"
      width={width}
      height={height}
      radius={radius}
      colors={SHIMMER_COLORS}
    />
  );
}
