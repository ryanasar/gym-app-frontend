import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { getAllExerciseTemplates } from '../api/exerciseTemplatesApi';
import { createWorkout } from '../api/workoutsApi';
import { createExercise } from '../api/exercisesApi';
import { getAllMuscles } from '../api/musclesApi';
import { useAuth } from '../auth/auth';

const MakeWorkoutScreen = () => {
  const { user, refreshWorkouts } = useAuth();
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [availableExerciseTemplates, setAvailableExerciseTemplates] = useState([]);
  const [filteredExerciseTemplates, setFilteredExerciseTemplates] = useState([]);
  const [allMuscles, setAllMuscles] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const [templates, muscles] = await Promise.all([
        getAllExerciseTemplates(),
        getAllMuscles()
      ]);
      setAvailableExerciseTemplates(templates);
      setFilteredExerciseTemplates(templates);
      setAllMuscles(muscles);
    } catch (_error) {
      Alert.alert('Error', 'Failed to load exercise templates');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = (template) => {
    const newExercise = {
      id: Date.now(),
      exerciseTemplateId: template.id,
      name: template.name,
      description: template.description,
      equipment: template.equipment,
      difficulty: template.difficulty,
      muscles: template.muscles,
      reps: '',
      weight: '',
      sets: 1
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowExerciseModal(false);
  };

  const removeExercise = (id) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id, field, value) => {
    setSelectedExercises(selectedExercises.map(ex =>
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const filterExercises = () => {
    let filtered = availableExerciseTemplates;

    if (selectedEquipment.length > 0) {
      filtered = filtered.filter(template =>
        template.equipment && selectedEquipment.some(equip =>
          template.equipment.toLowerCase().includes(equip.toLowerCase())
        )
      );
    }

    if (selectedMuscles.length > 0) {
      filtered = filtered.filter(template =>
        template.muscles && template.muscles.some(muscleTemplate =>
          selectedMuscles.includes(muscleTemplate.muscle?.id || muscleTemplate.muscleId)
        )
      );
    }

    setFilteredExerciseTemplates(filtered);
  };

  const clearFilters = () => {
    setSelectedEquipment([]);
    setSelectedMuscles([]);
    setFilteredExerciseTemplates(availableExerciseTemplates);
  };

  const getUniqueEquipment = () => {
    const equipment = new Set();
    availableExerciseTemplates.forEach(template => {
      if (template.equipment) {
        equipment.add(template.equipment);
      }
    });
    return Array.from(equipment).sort();
  };

  useEffect(() => {
    filterExercises();
  }, [selectedEquipment, selectedMuscles, availableExerciseTemplates]);

  const handleCreateWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    setCreating(true);
    try {
      const workoutData = {
        title: workoutName,
        notes: workoutNotes,
        userId: user?.id
      };

      const createdWorkout = await createWorkout(workoutData);

      // Create exercises for the workout
      for (const exercise of selectedExercises) {
        await createExercise({
          workoutId: createdWorkout.id,
          exerciseTemplateId: exercise.exerciseTemplateId,
          sets: exercise.sets,
          reps: exercise.reps ? parseInt(exercise.reps) : null,
          weight: exercise.weight ? parseInt(exercise.weight) : null,
          muscles: exercise.muscles?.map(m => m.muscle?.id || m.muscleId).filter(Boolean) || []
        });
      }
      await refreshWorkouts();

      Alert.alert('Success', 'Workout created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/workout');
          }
        }
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to create workout');
    } finally {
      setCreating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return Colors.light.secondary;
    }
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseNameContainer}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          {item.difficulty && (
            <View style={[styles.difficultyBadgeSmall, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyTextSmall}>{item.difficulty}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => removeExercise(item.id)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sets</Text>
          <TextInput
            style={styles.setsInput}
            value={item.sets.toString()}
            onChangeText={(value) => updateExercise(item.id, 'sets', parseInt(value) || 1)}
            keyboardType="numeric"
            placeholder="1"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps (optional)</Text>
          <TextInput
            style={styles.input}
            value={item.reps}
            onChangeText={(value) => updateExercise(item.id, 'reps', value)}
            keyboardType="numeric"
            placeholder="12"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (optional)</Text>
          <TextInput
            style={styles.input}
            value={item.weight}
            onChangeText={(value) => updateExercise(item.id, 'weight', value)}
            keyboardType="numeric"
            placeholder="45"
          />
        </View>
      </View>
    </View>
  );

  const renderAvailableExercise = ({ item }) => (
    <View style={styles.gridItemWrapper}>
      <TouchableOpacity
        style={styles.availableExerciseItem}
        onPress={() => addExercise(item)}
      >
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.exerciseImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        )}

        <View style={styles.exerciseContent}>
          <View style={styles.exerciseTemplateHeader}>
            <Text style={styles.availableExerciseName} numberOfLines={2}>{item.name}</Text>
            {item.difficulty && (
              <View style={[styles.difficultyBadgeSmall, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                <Text style={styles.difficultyTextSmall}>{item.difficulty}</Text>
              </View>
            )}
          </View>

          {item.equipment && (
            <Text style={styles.exerciseMeta} numberOfLines={1}>{item.equipment}</Text>
          )}

          {item.muscles && item.muscles.length > 0 && (
            <View style={styles.musclesContainer}>
              <View style={styles.musclesList}>
                {item.muscles.slice(0, 2).map((muscleTemplate, index) => (
                  <Text key={index} style={styles.muscleTagSmall} numberOfLines={1}>
                    {muscleTemplate.muscle?.name || muscleTemplate.name}{index < Math.min(item.muscles.length, 2) - 1 ? ', ' : ''}
                  </Text>
                ))}
                {item.muscles.length > 2 && (
                  <Text style={styles.muscleTagSmall}>+{item.muscles.length - 2}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading exercise templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Workout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Details</Text>

          <TextInput
            style={styles.nameInput}
            placeholder="Workout name"
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          <TextInput
            style={styles.notesInput}
            placeholder="Notes (optional)"
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.exercisesSectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowExerciseModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {selectedExercises.length === 0 ? (
            <View style={styles.noExercisesContainer}>
              <Text style={styles.noExercisesText}>No exercises added yet</Text>
              <Text style={styles.noExercisesSubtext}>Tap &quot;Add Exercise&quot; to get started</Text>
            </View>
          ) : (
            <FlatList
              data={selectedExercises}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderExerciseItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, creating && styles.disabledButton]}
          onPress={handleCreateWorkout}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Workout</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <TouchableOpacity
              onPress={() => setShowExerciseModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filtersContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Exercises</Text>
              {(selectedEquipment.length > 0 || selectedMuscles.length > 0) && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Equipment</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
                <View style={styles.chipContainer}>
                  {getUniqueEquipment().map((equipment, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterChip,
                        selectedEquipment.includes(equipment) && styles.filterChipActive
                      ]}
                      onPress={() => {
                        if (selectedEquipment.includes(equipment)) {
                          setSelectedEquipment(selectedEquipment.filter(equip => equip !== equipment));
                        } else {
                          setSelectedEquipment([...selectedEquipment, equipment]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedEquipment.includes(equipment) && styles.filterChipTextActive
                      ]}>{equipment}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Muscles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
                <View style={styles.chipContainer}>
                  {allMuscles.map((muscle) => (
                    <TouchableOpacity
                      key={muscle.id}
                      style={[
                        styles.filterChip,
                        selectedMuscles.includes(muscle.id) && styles.filterChipActive
                      ]}
                      onPress={() => {
                        if (selectedMuscles.includes(muscle.id)) {
                          setSelectedMuscles(selectedMuscles.filter(id => id !== muscle.id));
                        } else {
                          setSelectedMuscles([...selectedMuscles, muscle.id]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedMuscles.includes(muscle.id) && styles.filterChipTextActive
                      ]}>{muscle.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <FlatList
            data={filteredExerciseTemplates}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAvailableExercise}
            style={styles.exercisesList}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            ItemSeparatorComponent={() => <View style={styles.gridSeparator} />}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  notesInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  exercisesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noExercisesContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noExercisesText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  noExercisesSubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  exerciseItem: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  setsInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    width: 60,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.light.secondaryText,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  exercisesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  availableExerciseItem: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    overflow: 'hidden',
  },
  availableExerciseName: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
    flex: 1,
  },
  exerciseTemplateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  difficultyTextSmall: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  exerciseDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 8,
    lineHeight: 20,
  },
  exerciseMetaRow: {
    marginBottom: 8,
  },
  exerciseMeta: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  musclesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  musclesLabel: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  musclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  muscleTag: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  // Filter styles
  filtersContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.light.error,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  chipScrollView: {
    flexGrow: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  filterChipTextActive: {
    color: 'white',
  },
  // Grid styles
  gridItemWrapper: {
    flex: 1,
    paddingHorizontal: 4,
  },
  gridRow: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridSeparator: {
    height: 8,
  },
  exerciseImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: Colors.light.background,
  },
  exerciseContent: {
    padding: 12,
  },
  muscleTagSmall: {
    fontSize: 10,
    color: Colors.light.primary,
    fontWeight: '500',
  },
});

export default MakeWorkoutScreen;