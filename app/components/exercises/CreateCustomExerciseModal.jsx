import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getAllMuscleGroups } from '../../data/exercises/muscleGroups';

const CATEGORIES = [
  { id: 'compound', label: 'Compound', icon: '' },
  { id: 'isolation', label: 'Isolation', icon: '' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'pull_up_bar', label: 'Pull Up Bar' },
  { id: 'trap_bar', label: 'Trap Bar' },
];

const CreateCustomExerciseModal = ({ visible, onClose, onSave }) => {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(null);
  const [primaryMuscles, setPrimaryMuscles] = useState([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState([]);
  const [equipment, setEquipment] = useState(null);
  const [saving, setSaving] = useState(false);

  const allMuscleGroups = getAllMuscleGroups();

  const resetForm = () => {
    setName('');
    setCategory(null);
    setPrimaryMuscles([]);
    setSecondaryMuscles([]);
    setEquipment(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an exercise name');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        primaryMuscles,
        secondaryMuscles,
        equipment,
      });
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create exercise. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMuscle = (muscleKey, isPrimary) => {
    if (isPrimary) {
      if (primaryMuscles.includes(muscleKey)) {
        setPrimaryMuscles(primaryMuscles.filter(m => m !== muscleKey));
      } else {
        setPrimaryMuscles([...primaryMuscles, muscleKey]);
        // Remove from secondary if adding to primary
        setSecondaryMuscles(secondaryMuscles.filter(m => m !== muscleKey));
      }
    } else {
      if (secondaryMuscles.includes(muscleKey)) {
        setSecondaryMuscles(secondaryMuscles.filter(m => m !== muscleKey));
      } else {
        setSecondaryMuscles([...secondaryMuscles, muscleKey]);
        // Remove from primary if adding to secondary
        setPrimaryMuscles(primaryMuscles.filter(m => m !== muscleKey));
      }
    }
  };

  const renderMuscleChips = (selectedMuscles, isPrimary) => {
    return (
      <View style={styles.chipsContainer}>
        {allMuscleGroups.map((muscle) => {
          const isSelected = selectedMuscles.includes(muscle.key);
          const isInOther = isPrimary
            ? secondaryMuscles.includes(muscle.key)
            : primaryMuscles.includes(muscle.key);

          return (
            <TouchableOpacity
              key={muscle.key}
              style={[
                styles.chip,
                { backgroundColor: colors.borderLight, borderColor: colors.border },
                isSelected && { backgroundColor: muscle.color + '30', borderColor: muscle.color },
                isInOther && styles.chipDisabled,
              ]}
              onPress={() => !isInOther && toggleMuscle(muscle.key, isPrimary)}
              disabled={isInOther}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
                  isSelected && { color: muscle.color, fontWeight: '600' },
                  isInOther && { color: colors.placeholder },
                ]}
              >
                {muscle.icon} {muscle.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={handleClose} disabled={saving}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Exercise</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[
                styles.saveText,
                { color: colors.primary },
                !name.trim() && { color: colors.placeholder },
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Name <Text style={{ color: colors.primary }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g., Incline Dumbbell Press"
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
              maxLength={50}
              autoFocus
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.optionRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.borderLight, borderColor: colors.border },
                    category === cat.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                  ]}
                  onPress={() => setCategory(category === cat.id ? null : cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.text },
                      category === cat.id && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Primary Muscles */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Primary Muscles</Text>
            <Text style={[styles.hint, { color: colors.secondaryText }]}>
              Select the main muscles this exercise targets
            </Text>
            {renderMuscleChips(primaryMuscles, true)}
          </View>

          {/* Secondary Muscles */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Secondary Muscles</Text>
            <Text style={[styles.hint, { color: colors.secondaryText }]}>
              Select any supporting muscles
            </Text>
            {renderMuscleChips(secondaryMuscles, false)}
          </View>

          {/* Equipment */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Equipment</Text>
            <View style={styles.chipsContainer}>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <TouchableOpacity
                  key={eq.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.borderLight, borderColor: colors.border },
                    equipment === eq.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                  ]}
                  onPress={() => setEquipment(equipment === eq.id ? null : eq.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.text },
                      equipment === eq.id && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {eq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default CreateCustomExerciseModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  chipDisabled: {
    opacity: 0.4,
  },
});
