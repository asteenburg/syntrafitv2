type Muscle = string;

type MuscleState = {
  fatigue: number;      // 0–1
  lastUsed: number;     // timestamp
};

const muscleMemory: Record<Muscle, MuscleState> = {};

export function getMuscleState(muscle: Muscle): MuscleState {
  if (!muscleMemory[muscle]) {
    muscleMemory[muscle] = {
      fatigue: 0,
      lastUsed: Date.now(),
    };
  }
  return muscleMemory[muscle];
}

export function updateMuscleState(muscles: Muscle[]) {
  const now = Date.now();

  muscles.forEach((m) => {
    const state = getMuscleState(m);

    state.fatigue = Math.min(1, state.fatigue + 0.25);
    state.lastUsed = now;
  });
}

/**
 * Passive recovery decay (call on generate)
 */
export function decayMuscles() {
  const now = Date.now();

  Object.values(muscleMemory).forEach((state) => {
    const hours = (now - state.lastUsed) / (1000 * 60 * 60);
    state.fatigue = Math.max(0, state.fatigue - hours * 0.03);
  });
}