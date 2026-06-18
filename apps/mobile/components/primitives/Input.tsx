/**
 * primitives/Input.tsx
 * Animated floating-label text input.
 * Label floats up on focus/fill using Moti for a clean spring-driven feel.
 */
import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, Pressable,
} from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  /** Show a show/hide eye icon — use for password fields */
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  testID?: string;
}

export default function Input({
  label,
  error,
  isPassword,
  containerStyle,
  leftIcon,
  testID,
  value,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword ?? false);

  const floated = focused || (value !== undefined && value !== '');

  return (
    <View style={[styles.outer, containerStyle]}>
      {/* Input container — lifts slightly on focus */}
      <MotiView
        animate={{
          shadowOpacity: focused ? 0.22 : 0,
          borderColor: error
            ? Colors.danger
            : focused
            ? Colors.peach
            : Colors.divider,
        }}
        transition={{ type: 'timing', duration: 200 }}
        style={styles.box}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? Colors.peach : Colors.textMuted}
            style={styles.leftIcon}
          />
        )}

        {/* Floating label */}
        <MotiText
          animate={{
            translateY: floated ? -10 : 0,
            fontSize: floated ? 11 : 15,
            color: error
              ? Colors.danger
              : focused
              ? Colors.peachDark
              : Colors.textMuted,
          }}
          transition={{ type: 'timing', duration: 180 }}
          style={[styles.label, leftIcon && styles.labelWithIcon]}
        >
          {label}
        </MotiText>

        <TextInput
          style={[styles.input, leftIcon && styles.inputWithIcon]}
          value={value}
          secureTextEntry={hidden}
          placeholderTextColor="transparent"
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          testID={testID}
          {...rest}
        />

        {isPassword && (
          <Pressable onPress={() => setHidden((v) => !v)} style={styles.eye} hitSlop={12}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>
        )}
      </MotiView>

      {/* Inline error — no popup alerts */}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: Spacing.md },
  box: {
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingTop: 22,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    // Shadow applied via Moti animate
    shadowColor: Colors.peach,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 0,
  },
  leftIcon: { marginRight: Spacing.sm },
  label: {
    position: 'absolute',
    left: Spacing.md,
    top: 16,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textMuted,
  },
  labelWithIcon: { left: Spacing.md + 18 + Spacing.sm },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputWithIcon: { marginLeft: 0 },
  eye: { padding: 4 },
  error: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});
