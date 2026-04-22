function hasAllFlags(conditionFlags = [], resolvedFlags = []) {
  return conditionFlags.every((flag) => resolvedFlags.includes(flag));
}

function hasAnyFlag(conditionFlags = [], resolvedFlags = []) {
  return conditionFlags.length === 0 || conditionFlags.some((flag) => resolvedFlags.includes(flag));
}

export function matchesCondition(condition = {}, state = {}) {
  if (!condition) {
    return true;
  }

  const resolvedFlags = state.resolvedFlags ?? [];
  const visitedChambers = state.visitedChambers ?? [];
  const completedEncounters = state.completedEncounters ?? [];

  if (!hasAllFlags(condition.flagsAll, resolvedFlags)) {
    return false;
  }

  if (!hasAnyFlag(condition.flagsAny, resolvedFlags)) {
    return false;
  }

  if ((condition.flagsNot ?? []).some((flag) => resolvedFlags.includes(flag))) {
    return false;
  }

  if ((condition.visitedAll ?? []).some((chamberId) => !visitedChambers.includes(chamberId))) {
    return false;
  }

  if ((condition.completedAll ?? []).some((encounterId) => !completedEncounters.includes(encounterId))) {
    return false;
  }

  if (condition.dominantArchetype && state.dominantArchetype !== condition.dominantArchetype) {
    return false;
  }

  for (const [scoreKey, minimum] of Object.entries(condition.scoreAtLeast ?? {})) {
    if ((state[scoreKey] ?? 0) < minimum) {
      return false;
    }
  }

  for (const [scoreKey, maximum] of Object.entries(condition.scoreAtMost ?? {})) {
    if ((state[scoreKey] ?? 0) > maximum) {
      return false;
    }
  }

  return true;
}

export function resolveConditionalValue(value, state, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value)) {
    return fallback;
  }

  for (const entry of value) {
    if (matchesCondition(entry.when, state)) {
      return entry.value;
    }
  }

  return fallback;
}