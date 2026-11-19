// US-005-3: full account deletion flow end-to-end.
//
// E2E coverage for the browser-side acceptance criteria:
//   AC-012 — a signed-in user can delete their account from the account
//     settings screen, and after deletion they are redirected to /sign-in.
//   AC-013 — after account deletion, attempting to sign in with the deleted
//     account's email and password fails.
//   NFR-002 — after account deletion the previous session token is no longer
//     valid: navigating to the task list redirects to /sign-in.
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database directly), which signs the user in and lands them
// on the task list. Unique, run-time generated credentials keep the suite
// independent and keep no literal password in the repository.

import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-us005-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

// The localStorage key api.ts stores the session token under.
const SESSION_TOKEN_KEY = "session_token";

// Register a fresh user through the UI, land on the task list, and return the
// credentials so the caller can attempt to re-sign-in after deletion.
async function registerAndLandOnTasks(
  page: import("@playwright/test").Page,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail();
  const password = uniquePassword();
  await page.goto("/register");
  await page.locator("#reg-email").fill(email);
  await page.locator("#reg-password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
  return { email, password };
}

test.describe("US-005 Delete account", () => {
  test("[AC-012] a signed-in user deletes their account and is redirected to /sign-in", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // A session token was issued and stored before deletion.
    const tokenBefore = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(tokenBefore).toBeTruthy();

    // Navigate to account settings.
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();

    // Open the confirm-deletion modal.
    await page.getByRole("button", { name: "Delete My Account" }).click();
    await expect(page.getByRole("heading", { name: "Confirm Account Deletion" })).toBeVisible();

    // Type DELETE to enable the confirm button, then confirm.
    await page.locator("#confirm-delete").fill("DELETE");
    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();

    // Redirected to the sign-in page after deletion.
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.locator("#signin-email")).toBeVisible();

    // The local session token was cleared.
    const tokenAfter = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(tokenAfter).toBeNull();
  });

  test("[AC-013] after deletion, signing in with the deleted account's credentials fails", async ({
    page,
  }) => {
    const { email, password } = await registerAndLandOnTasks(page);

    // Delete the account through the UI.
    await page.goto("/account");
    await page.getByRole("button", { name: "Delete My Account" }).click();
    await page.locator("#confirm-delete").fill("DELETE");
    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    // Attempt to sign in with the now-deleted account's credentials.
    await page.locator("#signin-email").fill(email);
    await page.locator("#signin-password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Sign-in fails: stays on /sign-in and shows an error, never lands on tasks.
    await expect(page).toHaveURL(/\/sign-in$/);
    const alert = page.locator("[role='alert']");
    await expect(alert).toBeVisible();
    // No session token is issued for a deleted account.
    const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(token).toBeNull();
  });

  test("[NFR-002] after deletion, the previous session token is invalid: /tasks redirects to /sign-in", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Capture the genuine session token before deletion.
    const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(token).toBeTruthy();

    // Delete the account through the UI.
    await page.goto("/account");
    await page.getByRole("button", { name: "Delete My Account" }).click();
    await page.locator("#confirm-delete").fill("DELETE");
    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    // Restore the old, now-revoked token into localStorage and attempt to view
    // the task list. The API returns 401, the global handler clears the token
    // and redirects to /sign-in.
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: SESSION_TOKEN_KEY,
      value: token,
    });

    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.locator("#signin-email")).toBeVisible();

    // The revoked token was cleared by the 401 handler.
    const tokenAfter = await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY);
    expect(tokenAfter).toBeNull();
  });
});
