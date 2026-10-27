import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  contactInput,
  isAdminId,
  reviewInput,
} from "../lib/contact";
test("admin access is closed by default and uses exact IDs", () => {
  assert.equal(isAdminId("u1", undefined), false);
  assert.equal(isAdminId(undefined, "u1"), false);
  assert.equal(isAdminId("u", "u1"), false);
  assert.equal(isAdminId("u1", " u1, u2"), true);
});
test("request cannot inject identity or approval and requires consent", () => {
  const value = {
    profileId: "01234567-89ab-4cde-8fab-0123456789ab",
    message: "相談したい制作内容と予算と時期についてご連絡します。",
    consent: true,
  };
  assert.ok(contactInput.safeParse(value).success);
  for (const injection of [
    { requesterId: "victim" },
    { status: "approved" },
    { consent: false },
  ])
    assert.equal(
      contactInput.safeParse({ ...value, ...injection }).success,
      false,
    );
});
test("handoff requires saved approval and terminal states cannot reopen", () => {
  assert.equal(canTransition("pending", "forwarded"), false);
  assert.equal(canTransition("pending", "approved"), true);
  assert.equal(canTransition("approved", "forwarded"), true);
  assert.equal(canTransition("declined", "approved"), false);
  assert.equal(canTransition("forwarded", "pending"), false);
  assert.equal(canTransition("forwarded", "forwarded"), true);
  assert.equal(reviewInput.safeParse({ status: "admin" }).success, false);
});
