// US-003-3: sign-out ends the session and expired/invalid tokens prompt re-sign-in.
//
// E2E coverage for the two browser-side acceptance criteria:
//   1. A signed-in user clicks Sign Out, is redirected to /sign-in, and a
//      later navigation to /tasks also redirects to /sign-in (no lingering
//      session).
//   2. A signed-in user whose localStorage token is replaced with an invalid
//      value is redirected to /sign-in when attempting to view tasks (the
//      401 from the API ends the local session).
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database), which signs the user in and lands them on the
// task list. Unique, run-time generated credentials keep the suite independent
// and keep no literal password in the repository.

import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-us003-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

// The localStorage key api.ts stores the session token under.
const SESSION_TOKEN_KEY = "session_token";

// Register a fresh user through the UI and land on the task list, signed in.
async function registerAndLandOnTasks(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/register");
  await page.locator("#reg-email").fill(uniqueEmail());
  await page.locator("#reg-password").fill(uniquePassword());
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
}

test.describe("US-003 sign-out ends the session", () => {
  test("[US-003] a signed-in user clicks Sign Out and is redirected to /sign-in; /tasks then redirects to /sign-in", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // The session token is present before sign-out.
    const tokenBefore = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(tokenBefore).toBeTruthy();

    // Go to the account settings where the Sign Out button lives.
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();

    // Click Sign Out.
    await page.getByRole("button", { name: "Sign Out" }).click();

    // Redirected to the sign-in page.
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.locator("#signin-email")).toBeVisible();

    // The local session token was cleared.
    const tokenAfter = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(tokenAfter).toBeNull();

    // Navigating to /tasks now redirects back to /sign-in (no lingering session).
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("[US-003] a user whose token is replaced with an invalid value is redirected to /sign-in when viewing tasks", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Confirm the user is genuinely signed in.
    const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(token).toBeTruthy();

    // Replace the stored token with an invalid value.
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: SESSION_TOKEN_KEY,
      value: "invalid-token-" + crypto.randomUUID(),
    });

    // Attempting to view tasks: RequireAuth sees a token exists and renders
    // Tasks, which calls the API; the 401 ends the local session and redirects
    // to /sign-in.
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.locator("#signin-email")).toBeVisible();

    // The invalid token was cleared from localStorage by the 401 handler.
    const tokenAfter = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(tokenAfter).toBeNull();
  });
});
