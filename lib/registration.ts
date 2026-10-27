import { z } from "zod";
export const registrationInput = z
  .object({ role: z.enum(["creator", "seeker"]) })
  .strict();
export type AccountRole = z.infer<typeof registrationInput>["role"];
export function registrationDestination(role: AccountRole) {
  return role === "creator" ? "/?onboarding=1" : "/";
}
