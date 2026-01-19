import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const SettingsDropdown = ({ onSignOut }) => {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState(false);

  const handleSignOut = () => {
    setIsVisible(false);
    onSignOut();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: colors.borderLight, borderColor: colors.border }]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.settingsIcon, { color: colors.text }]}>⋯</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleSignOut}
            >
              <Text style={[styles.dropdownText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  settingsIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  dropdown: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsDropdown;