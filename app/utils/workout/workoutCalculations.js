import { Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const calculateWorkoutCardCollapse = (todaysWorkout) => {
  if (!todaysWorkout?.exercises) return { shouldCollapse: false, maxVisibleExercises: 0 };

  // Estimated heights (in pixels)
  const HEADER_HEIGHT = 100;
  const CONTENT_PADDING = 32;
  const CARD_PADDING = 40;
  const WORKOUT_HEADER_HEIGHT = 80;
  const EXERCISE_ITEM_HEIGHT = 52;
  const SHOW_MORE_BUTTON_HEIGHT = 30;
  const ACTION_BUTTONS_HEIGHT = 130;
  const BOTTOM_SAFE_AREA = 130;

  const totalExercises = todaysWorkout.exercises.length;

  // Calculate height with all exercises
  const fullCardHeight =
    HEADER_HEIGHT +
    CONTENT_PADDING +
    CARD_PADDING +
    WORKOUT_HEADER_HEIGHT +
    (EXERCISE_ITEM_HEIGHT * totalExercises) +
    ACTION_BUTTONS_HEIGHT +
    BOTTOM_SAFE_AREA;

  // If it fits, show all exercises
  if (fullCardHeight <= SCREEN_HEIGHT) {
    return { shouldCollapse: false, maxVisibleExercises: totalExercises };
  }

  // Otherwise, calculate max exercises that fit
  const availableHeight = SCREEN_HEIGHT - (
    HEADER_HEIGHT +
    CONTENT_PADDING +
    CARD_PADDING +
    WORKOUT_HEADER_HEIGHT +
    SHOW_MORE_BUTTON_HEIGHT +
    ACTION_BUTTONS_HEIGHT +
    BOTTOM_SAFE_AREA
  );

  const maxExercises = Math.max(3, Math.floor(availableHeight / EXERCISE_ITEM_HEIGHT));

  return {
    shouldCollapse: totalExercises > maxExercises,
    maxVisibleExercises: maxExercises
  };
};

export const checkIfSplitCompleted = (activeSplit, todaysWorkout) => {
  if (!activeSplit?.days || !todaysWorkout?.dayNumber) return false;

  const currentDayIndex = todaysWorkout.dayNumber - 1;
  const totalDays = activeSplit.days.length;

  // Check if there are any workout days after this one
  for (let i = currentDayIndex + 1; i < totalDays; i++) {
    const day = activeSplit.days[i];
    if (day && !day.isRest) {
      return false;
    }
  }

  return true;
};
