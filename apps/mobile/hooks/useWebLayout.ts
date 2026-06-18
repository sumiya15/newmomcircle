/**
 * hooks/useWebLayout.ts
 *
 * Convenience hook exposing responsive layout values derived from
 * WebWrapper's breakpoint constants so screens can compute adaptive
 * styles (e.g. hero image height) without duplicating magic numbers.
 */

import { Platform, useWindowDimensions } from 'react-native';
import { WEB_BREAKPOINT, WEB_MAX_WIDTH } from '../components/common/WebWrapper';

export interface WebLayout {
  /** True only when running on web with a viewport wider than WEB_BREAKPOINT. */
  isWideWeb: boolean;
  /**
   * The effective content column width in pixels:
   *   • WEB_MAX_WIDTH on wide web
   *   • current window width on native / narrow browser
   */
  contentWidth: number;
}

export function useWebLayout(): WebLayout {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width > WEB_BREAKPOINT;
  return {
    isWideWeb,
    contentWidth: isWideWeb ? WEB_MAX_WIDTH : width,
  };
}
