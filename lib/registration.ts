import { z } from "zod";
export const registrationInput = z
  .object({ role: z.enum(["creator", "seeker"]) })
  .strict();
export type AccountRole = z.infer<typeof registrationInput>["role"];
export function registrationDestination(role: AccountRole) {
  return role === "creator" ? "/?onboarding=1" : "/";
}

// Existing accounts can add a second purpose without losing the first.
export type StoredRole = AccountRole | "both";
export function hasRole(
  stored: StoredRole | null | undefined,
  requested: AccountRole,
) {
  return stored === "both" || stored === requested;
}

export function roleFromRegistrations(
  creator: boolean,
  seeker: boolean,
): StoredRole | null {
  if (creator && seeker) return "both";
  if (creator) return "creator";
  if (seeker) return "seeker";
  return null;
}
