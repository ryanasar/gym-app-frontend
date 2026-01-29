import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { createSavedWorkout, updateSavedWorkout } from '../api/savedWorkoutsApi';
import { exercises } from '../data/exercises/exerciseDatabase';
import ExerciseCard from '../components/exercises/ExerciseCard';
import EmptyState from '../components/common/EmptyState';

const CreateSavedWorkoutScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse params for edit mode
  const isEditMode = params.mode === 'edit';
  const workoutId = params.workoutId;
  const initialWorkoutData = params.workoutData ? JSON.parse(params.workoutData) : null;

  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutEmoji, setWorkoutEmoji] = useState('💪');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  // Initialize state from workout data in edit mode
  useEffect(() => {
    if (isEditMode && initialWorkoutData) {
      setWorkoutName(initialWorkoutData.name || '');
      setWorkoutDescription(initialWorkoutData.description || '');
      setWorkoutEmoji(initialWorkoutData.emoji || '💪');

      // Map exercises to include all needed fields
      if (initialWorkoutData.exercises && initialWorkoutData.exercises.length > 0) {
        const mappedExercises = initialWorkoutData.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets?.toString() || '',
          reps: ex.reps?.toString() || '',
          weight: ex.weight?.toString() || '',
          restSeconds: ex.restSeconds?.toString() || '',
          notes: ex.notes || '',
          primaryMuscles: ex.primaryMuscles || [],
          secondaryMuscles: ex.secondaryMuscles || [],
          category: ex.category || '',
          isCustom: ex.isCustom || false,
        }));
        setSelectedExercises(mappedExercises);
      }
    }
  }, []);

  const muscleGroups = [
    { id: 'all', name: 'All' },
    { id: 'chest', name: 'Chest' },
    { id: 'lats', name: 'Back' },
    { id: 'front_delts', name: 'Shoulders' },
    { id: 'biceps', name: 'Biceps' },
    { id: 'triceps', name: 'Triceps' },
    { id: 'quadriceps', name: 'Legs' },
    { id: 'core', name: 'Core' },
  ];

  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    setSaving(true);
    try {
      const workoutPayload = {
        name: workoutName.trim(),
        description: workoutDescription.trim() || null,
        emoji: workoutEmoji,
        exercises: selectedExercises
      };

      if (isEditMode && workoutId) {
        await updateSavedWorkout(workoutId, workoutPayload);
      } else {
        await createSavedWorkout(workoutPayload);
      }

      router.back();
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const addExercise = (exercise) => {
    if (selectedExercises.length >= 20) {
      Alert.alert('Limit Reached', 'Maximum 20 exercises per workout');
      return;
    }

    const newExercise = {
      ...exercise,
      sets: '',
      reps: '',
      weight: '',
      restSeconds: '',
      notes: ''
    };

    setSelectedExercises([...selectedExercises, newExercise]);
    setExercisePickerVisible(false);
  };

  const removeExercise = (index) => {
    const updated = [...selectedExercises];
    updated.splice(index, 1);
    setSelectedExercises(updated);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index][field] = value;
    setSelectedExercises(updated);
  };

  const handleReorderExercises = useCallback(({ data }) => {
    setSelectedExercises(data);
  }, []);

  const getFilteredExercises = () => {
    let filtered = [...exercises];

    if (selectedMuscleFilter !== 'all') {
      filtered = filtered.filter(ex =>
        ex.primaryMuscles?.includes(selectedMuscleFilter)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscles?.some(m => m.toLowerCase().includes(q)) ||
        ex.equipment?.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const renderExerciseItem = useCallback(({ item, drag, isActive, getIndex }) => {
    const index = getIndex();
    return (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.exerciseCard,
          { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
          isActive && { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }
        ]}
      >
        <View style={styles.exerciseCardHeader}>
          <TouchableOpacity onPressIn={drag} disabled={isActive} style={styles.dragHandle}>
            <Ionicons name="menu" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          <View style={[styles.exerciseNumber, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.exerciseNumberText, { color: colors.primary }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={() => removeExercise(index)} style={styles.removeButton}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.exerciseInputs}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Sets</Text>
            <TextInput
              style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="3"
              placeholderTextColor={colors.placeholder}
              value={item.sets}
              onChangeText={(v) => updateExercise(index, 'sets', v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Reps</Text>
            <TextInput
              style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="8-12"
              placeholderTextColor={colors.placeholder}
              value={item.reps}
              onChangeText={(v) => updateExercise(index, 'reps', v.replace(/[^0-9\-]/g, ''))}
              keyboardType="numbers-and-punctuation"
              maxLength={7}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Weight</Text>
            <TextInput
              style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="135"
              placeholderTextColor={colors.placeholder}
              value={item.weight}
              onChangeText={(v) => updateExercise(index, 'weight', v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={6}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedExercises, colors]);

  const renderHeader = () => (
    <>
      {/* Workout Name */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Workout Name <Text style={{ color: colors.primary }}>*</Text>
        </Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., Push Day A"
          placeholderTextColor={colors.placeholder}
          value={workoutName}
          onChangeText={setWorkoutName}
          maxLength={50}
        />
      </View>

      {/* Description */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Description (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
          placeholder="Brief description..."
          placeholderTextColor={colors.placeholder}
          value={workoutDescription}
          onChangeText={setWorkoutDescription}
          multiline
          maxLength={200}
        />
      </View>

      {/* Exercises Header */}
      <View style={styles.exercisesHeader}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Exercises</Text>
        <View style={[styles.counter, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.counterText, { color: colors.text }, selectedExercises.length >= 20 && { color: '#EF4444' }]}>
            {selectedExercises.length}/20
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.addExerciseButton,
          { backgroundColor: colors.primary },
          selectedExercises.length >= 20 && { backgroundColor: colors.borderLight }
        ]}
        onPress={() => setExercisePickerVisible(true)}
        disabled={selectedExercises.length >= 20}
      >
        <Ionicons
          name="add-circle"
          size={20}
          color={selectedExercises.length >= 20 ? colors.secondaryText : colors.onPrimary}
        />
        <Text style={[
          styles.addExerciseText,
          { color: colors.onPrimary },
          selectedExercises.length >= 20 && { color: colors.secondaryText }
        ]}>
          Add Exercise
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderEmpty = () => (
    <EmptyState
      emoji="💪"
      title="No exercises added"
      message="Add exercises to build your workout"
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditMode ? 'Edit Workout' : 'Create Workout'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !workoutName.trim() || selectedExercises.length === 0}
          style={styles.headerButton}
        >
          <Text style={[
            styles.saveText,
            { color: colors.primary },
            (saving || !workoutName.trim() || selectedExercises.length === 0) && { opacity: 0.5 }
          ]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <DraggableFlatList
          data={selectedExercises}
          keyExtractor={(item, index) => `exercise-${item.id || item.name}-${index}`}
          onDragEnd={handleReorderExercises}
          renderItem={renderExerciseItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <Modal visible={exercisePickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => setExercisePickerVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          {/* Search */}
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle.id}
                  style={[
                    styles.filterPill,
                    { backgroundColor: colors.borderLight },
                    selectedMuscleFilter === muscle.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedMuscleFilter(muscle.id)}
                >
                  <Text style={[
                    styles.filterText,
                    { color: colors.text },
                    selectedMuscleFilter === muscle.id && { color: colors.onPrimary }
                  ]}>
                    {muscle.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise List */}
          <ScrollView style={styles.exercisePickerList} contentContainerStyle={styles.exercisePickerContent}>
            {getFilteredExercises().map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={() => addExercise(exercise)}
                compact={true}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
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
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counter: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dragHandle: {
    padding: 4,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  dragHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Modal styles
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalPlaceholder: {
    width: 60,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterSection: {
    paddingBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exercisePickerList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  exercisePickerContent: {
    paddingBottom: 32,
  },
});

export default CreateSavedWorkoutScreen;
