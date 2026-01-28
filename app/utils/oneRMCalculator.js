/**
 * 1RM Calculator using Epley formula
 * Estimates one-rep max from a given weight and rep count
 */

/**
 * Calculate estimated 1RM using Epley formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of reps completed
 * @returns {number} Estimated 1RM
 */
export function calculateOneRM(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Get the best estimated 1RM from an array of sets
 * @param {Array<{weight: number, reps: number, completed: boolean}>} sets
 * @returns {number} Best estimated 1RM from the sets
 */
export function getBestOneRMFromSets(sets) {
  if (!sets || sets.length === 0) return 0;

  let best = 0;
  for (const set of sets) {
    if (!set.completed || !set.weight || set.weight <= 0) continue;
    const reps = set.reps || 0;
    if (reps <= 0) continue;
    const oneRM = calculateOneRM(set.weight, reps);
    if (oneRM > best) best = oneRM;
  }

  return Math.round(best / 5) * 5;
}
