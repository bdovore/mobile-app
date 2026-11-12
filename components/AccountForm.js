import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {CommonStyles} from '../styles/CommonStyles';

export function AccountPage({title, message, error, busy, children, onClose}) {
  return (
    <ScrollView
      style={CommonStyles.screenStyle}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}>
      <Text
        style={[CommonStyles.defaultText, styles.title]}
        accessibilityRole="header">
        {title}
      </Text>
      {message ? (
        <Text style={[CommonStyles.defaultText, styles.message]}>
          {message}
        </Text>
      ) : null}
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={styles.form} pointerEvents={busy ? 'none' : 'auto'}>
        {children}
      </View>
      {busy ? (
        <ActivityIndicator accessibilityLabel="Chargement" color="#990000" />
      ) : null}
      <AccountButton
        title="Fermer"
        secondary
        onPress={onClose}
        disabled={busy}
      />
    </ScrollView>
  );
}
export function AccountField({
  label,
  value,
  onChangeText,
  password = false,
  keyboardType,
  maxLength,
  autoComplete,
  ...props
}) {
  return (
    <View style={styles.field}>
      <Text style={[CommonStyles.defaultText, styles.label]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        style={[CommonStyles.defaultText, styles.input]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={password}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </View>
  );
}
export function AccountButton({
  title,
  onPress,
  secondary = false,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled}}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
      ]}>
      <Text
        style={
          secondary
            ? [CommonStyles.defaultText, styles.secondaryText]
            : styles.buttonText
        }>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
export const passwordHelp =
  'Au moins 15 caractères, au maximum 72 octets. Les espaces sont autorisés.';
const styles = StyleSheet.create({
  page: {padding: 24, paddingTop: 56, paddingBottom: 48, alignItems: 'center'},
  form: {width: '100%', maxWidth: 480},
  title: {fontSize: 26, fontWeight: '700', marginBottom: 20},
  message: {marginBottom: 16, lineHeight: 22, maxWidth: 480},
  error: {color: '#c93636', marginBottom: 16, maxWidth: 480},
  field: {marginBottom: 18},
  label: {marginBottom: 7, fontWeight: '600'},
  input: {
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 7,
    minWidth: 160,
  },
  primary: {backgroundColor: '#990000'},
  secondary: {borderWidth: 1, borderColor: '#888888'},
  buttonText: {color: '#ffffff', fontWeight: '600', fontSize: 16},
  secondaryText: {fontSize: 16},
  disabled: {opacity: 0.5},
});
