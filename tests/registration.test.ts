import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasRole,
  roleFromRegistrations,
  registrationInput,
  registrationDestination,
} from "../lib/registration";
test("registration rejects arbitrary roles and client supplied identities", () => {
  for (const body of [
    { role: "admin" },
    { role: "both" },
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

test("both roles retain creator and seeker capabilities; absent roles fail closed", () => {
  assert.equal(hasRole("both", "creator"), true);
  assert.equal(hasRole("both", "seeker"), true);
  assert.equal(hasRole("creator", "seeker"), false);
  assert.equal(hasRole("seeker", "creator"), false);
  assert.equal(hasRole("creator", "creator"), true);
  assert.equal(hasRole("seeker", "seeker"), true);
  assert.equal(hasRole(null, "creator"), false);
  assert.equal(hasRole(undefined, "seeker"), false);
});

test("independent registration rows determine capabilities without granting the other role", () => {
  assert.equal(roleFromRegistrations(false, false), null);
  assert.equal(roleFromRegistrations(true, false), "creator");
  assert.equal(roleFromRegistrations(false, true), "seeker");
  assert.equal(roleFromRegistrations(true, true), "both");
});
