import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const SettingsDropdown = ({ onSignOut, colorScheme = 'light' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleSignOut = () => {
    setIsVisible(false);
    onSignOut();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.settingsIcon, { color: Colors[colorScheme].text }]}>⋯</Text>
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
          <View style={[styles.dropdown, { backgroundColor: Colors[colorScheme].cardBackground }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleSignOut}
            >
              <Text style={[styles.dropdownText, { color: Colors[colorScheme].text }]}>Sign Out</Text>
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
    borderColor: Colors.light.border,
  },
  settingsIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  dropdown: {
    borderRadius: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsDropdown;