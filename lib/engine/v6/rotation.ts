import { Exercise } from "./types";

const cooldown = new Set<string>();

export function isOnCooldown(
  ex: Exercise
): boolean {
  return cooldown.has(ex.name);
}

export function markUsed(
  list: Exercise[]
): void {
  cooldown.clear();

  list.forEach((item) => {
    cooldown.add(item.name);
  });
}