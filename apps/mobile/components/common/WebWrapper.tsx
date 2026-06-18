/**
 * components/common/WebWrapper.tsx
 *
 * Transparent layout utility for cross-platform responsiveness.
 *
 * Behaviour:
 *   • Native (iOS / Android)      → zero-cost React fragment passthrough
 *   • Web, viewport ≤ WEB_BREAKPOINT → same passthrough (narrow / mobile browser)
 *   • Web, viewport > WEB_BREAKPOINT → wraps children in a centred column
 *       capped at WEB_MAX_WIDTH, with the outer View filling the full width so
 *       the root screen background colour still bleeds edge-to-edge.
 *
 * Usage:
 *   <View style={styles.root}>          ← full-width background
 *     <WebWrapper>                       ← caps & centres content on desktop web
 *       <MyContent />
 *     </WebWrapper>
 *   </View>
 */

import React from 'react';
import {
  View, StyleSheet, Platform, useWindowDimensions, ViewStyle,
} from 'react-native';

/** Maximum content column width on wide web viewports (px). */
export const WEB_MAX_WIDTH = 480;

/** Viewport width above which the wrapper activates (px). */
export const WEB_BREAKPOINT = 600;

interface WebWrapperProps {
  children: React.ReactNode;
  /** Additional styles merged onto the inner (max-width) container. */
  style?: ViewStyle;
}

export default function WebWrapper({ children, style }: WebWrapperProps) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width > WEB_BREAKPOINT;

  if (!isWideWeb) {
    // Native or narrow browser — transparent passthrough, zero overhead.
    return <>{children}</>;
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Fills the parent's full width; centres the inner column horizontally. */
  outer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  /** Content column capped at WEB_MAX_WIDTH, fills available height. */
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
  } as ViewStyle,
});
