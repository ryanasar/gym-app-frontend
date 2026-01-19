/**
 * Live Activity module for iOS workout tracking
 * Currently disabled - all methods are no-ops
 *
 * TODO: Re-enable when Live Activity native module is properly configured
 */
const LiveActivity = {
  isSupported: () => false,
  startWorkout: () => {},
  updateExercise: () => {},
  startRest: () => {},
  updateRest: () => {},
  endRest: () => {},
  stopWorkout: () => {},
  isActive: () => Promise.resolve(false),
};

export default LiveActivity;
