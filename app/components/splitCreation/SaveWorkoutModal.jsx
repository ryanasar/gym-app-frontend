import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const SaveWorkoutModal = ({
  visible,
  onClose,
  onSave,
  defaultName = '',
  defaultDescription = '',
  exerciseCount = 0,
  saving = false
}) => {
  const colors = useThemeColors();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (visible) {
      setName(defaultName);
      setDescription(defaultDescription);
    }
  }, [visible, defaultName, defaultDescription]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave(name.trim(), description.trim());
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Save Workout</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.previewText, { color: colors.secondaryText }]}>
            This will save {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} to your workout library for reuse
          </Text>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>
              Workout Name <Text style={{ color: colors.primary }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Push Day A"
              placeholderTextColor={colors.secondaryText}
              value={name}
              onChangeText={setName}
              maxLength={50}
              autoFocus
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Brief description..."
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              (!name.trim() || saving) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Save to Library</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SaveWorkoutModal;
