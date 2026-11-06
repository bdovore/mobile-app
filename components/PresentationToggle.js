import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Icon} from './Icon';
import {CommonStyles} from '../styles/CommonStyles';

export function PresentationToggle({gridMode, onPress}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={gridMode ? 'Afficher en liste' : 'Afficher en grille'}
      style={styles.button}>
      <Icon
        name={gridMode ? 'view-list' : 'view-grid-outline'}
        size={25}
        color={CommonStyles.iconStyle.color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
