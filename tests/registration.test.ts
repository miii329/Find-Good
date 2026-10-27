import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registrationInput,
  registrationDestination,
} from "../lib/registration";
test("registration rejects arbitrary roles and client supplied identities", () => {
  for (const body of [
    { role: "admin" },
    { role: "creator", userId: "other-user" },
    { role: "seeker", owner: "other" },
    { role: null },
    {},
  ]) {
    assert.equal(registrationInput.safeParse(body).success, false);
  }
});
test("creator onboarding and seeker browsing have distinct destinations", () => {
  assert.equal(
    registrationDestination(registrationInput.parse({ role: "creator" }).role),
    "/?onboarding=1",
  );
  assert.equal(
    registrationDestination(registrationInput.parse({ role: "seeker" }).role),
    "/",
  );
});
