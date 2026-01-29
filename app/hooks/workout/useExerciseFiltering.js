import { useMemo } from 'react';

export const useExerciseFiltering = ({
  exerciseDatabase,
  customExercises,
  localExercises,
  muscleFilter,
  searchQuery
}) => {
  const filteredExercises = useMemo(() => {
    // Handle "My Exercises" filter - only show custom exercises
    if (muscleFilter === 'my_exercises') {
      let filtered = customExercises.map(ex => ({ ...ex, isCustom: true }));

      // Exclude exercises already in workout
      filtered = filtered.filter(ex =>
        !localExercises.some(e => e.id === ex.id || e.name === ex.name)
      );

      if (searchQuery.trim()) {
        const lowercaseQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(ex =>
          ex.name.toLowerCase().includes(lowercaseQuery) ||
          ex.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          ex.equipment?.toLowerCase().includes(lowercaseQuery)
        );
      }

      return filtered;
    }

    // Merge bundled and custom exercises
    const allExercises = [
      ...exerciseDatabase,
      ...customExercises.map(ex => ({ ...ex, isCustom: true }))
    ];

    return allExercises.filter(ex => {
      // Exclude exercises already in workout
      if (localExercises.some(e => e.id === ex.id || e.name === ex.name)) return false;

      // Apply muscle filter first (only primary muscles)
      if (muscleFilter !== 'all') {
        const primaryMatch = ex.primaryMuscles && ex.primaryMuscles.includes(muscleFilter);
        if (!primaryMatch) return false;
      }

      // Then apply search filter
      if (searchQuery.trim()) {
        const lowercaseQuery = searchQuery.toLowerCase();
        return (
          ex.name.toLowerCase().includes(lowercaseQuery) ||
          ex.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          ex.secondaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          ex.equipment?.toLowerCase().includes(lowercaseQuery) ||
          ex.category?.toLowerCase().includes(lowercaseQuery)
        );
      }

      return true;
    });
  }, [exerciseDatabase, customExercises, localExercises, muscleFilter, searchQuery]);

  return filteredExercises;
};
