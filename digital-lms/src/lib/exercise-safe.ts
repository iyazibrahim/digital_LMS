/** Strip solution fields before sending exercises to learners. */
export function studentSafeExercise<T extends Record<string, unknown>>(exercise: T) {
  const testCases = Array.isArray(exercise.testCases)
    ? (exercise.testCases as { input?: string; expectedOutput?: string; isHidden?: boolean }[])
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({
          input: tc.input || "",
          isHidden: false,
        }))
    : [];

  const { expectedAnswers: _expectedAnswers, ...rest } = exercise;

  return {
    ...rest,
    testCases,
  };
}
