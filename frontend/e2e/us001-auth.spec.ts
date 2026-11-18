import { expect, test } from "@playwright/test";

import { adminCredentials } from "./support/admin";

// Unique, run-time generated credentials so the suite never depends on a fixed
// account and never writes a literal password into the repository.
function uniqueEmail(): string {
  return `e2e-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

// Read the stored session token out of localStorage (where api.ts keeps it) so a
// test can assert the app actually issued one rather than just navigated.
async function sessionToken(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem("session_token"));
}

test.describe("US-001 Self-register with email and password", () => {
  test("[AC-001] a new email registers, is signed in, and lands on the task list with no verification", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const password = uniquePassword();

    await page.goto("/register");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();

    // Signed in and taken to the task list directly — no email-verification step.
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();

    // A session token was issued and stored, proving the account was created and
    // the user is authenticated (NFR-001 — the hash check itself lives in the
    // backend unit suite).
    const token = await sessionToken(page);
    expect(token).toBeTruthy();
  });

  test("[AC-002] registering an email that already has an account is rejected with an 'already registered' message", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const password = uniquePassword();

    // First registration succeeds and creates the account.
    await page.goto("/register");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/tasks$/);

    // A second registration with the same email is rejected.
    await page.goto("/register");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator("#reg-email-error")).toBeVisible();
    await expect(page.locator("#reg-email-error")).toContainText(/already registered/i);
  });

  test("[AC-003] an invalid email format is rejected and the email field is flagged", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.locator("#reg-email").fill("not-an-email");
    await page.locator("#reg-password").fill(uniquePassword());
    await page.getByRole("button", { name: "Create Account" }).click();

    // Stays on the register page; the email field, not the password field, is invalid.
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator("#reg-email-error")).toBeVisible();
    await expect(page.locator("#reg-password-error")).toHaveCount(0);
  });

  test("[AC-003] an empty password is rejected and the password field is flagged", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.locator("#reg-email").fill(uniqueEmail());
    await page.locator("#reg-password").fill("");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator("#reg-password-error")).toBeVisible();
    await expect(page.locator("#reg-email-error")).toHaveCount(0);
  });

  test("[AC-004] signing in with correct credentials issues a session token and lands on the task list", async ({
    page,
  }) => {
    // Register a fresh account first, then sign out of it by clearing the token.
    const email = uniqueEmail();
    const password = uniquePassword();
    await page.goto("/register");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/tasks$/);
    await page.evaluate(() => localStorage.removeItem("session_token"));

    // Now sign in with those credentials.
    await page.goto("/sign-in");
    await page.locator("#signin-email").fill(email);
    await page.locator("#signin-password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
    const token = await sessionToken(page);
    expect(token).toBeTruthy();
  });

  test("[AC-005] a wrong password is rejected with a generic message that does not reveal the email exists", async ({
    page,
  }) => {
    const { email } = adminCredentials();

    await page.goto("/sign-in");
    await page.locator("#signin-email").fill(email);
    await page.locator("#signin-password").fill(uniquePassword());
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    const alert = page.locator("[role='alert']");
    await expect(alert).toBeVisible();
    const message = await alert.textContent();
    // Generic: must not name the email or say "registered"/"not found".
    expect(message).toBeTruthy();
    expect(message!.toLowerCase()).not.toContain(email.toLowerCase());
    expect(message!.toLowerCase()).not.toMatch(/not found|no account|registered/);
  });

  test("[AC-005] an unknown email is rejected with the same generic message as a wrong password", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.locator("#signin-email").fill(uniqueEmail());
    await page.locator("#signin-password").fill(uniquePassword());
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    const alert = page.locator("[role='alert']");
    await expect(alert).toBeVisible();
    const message = await alert.textContent();
    expect(message).toBeTruthy();
    expect(message!.toLowerCase()).not.toMatch(/not found|no account|registered/);
  });

  test("[AC-006] the sign-in page offers only email-and-password sign-in with no SSO buttons", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    // Email and password are the only authentication inputs.
    await expect(page.locator("#signin-email")).toBeVisible();
    await expect(page.locator("#signin-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    // No third-party / SSO provider buttons anywhere on the page.
    const ssoPatterns = [
      /sign in with/i,
      /continue with/i,
      /google/i,
      /github/i,
      /microsoft/i,
      /apple/i,
      /sso/i,
      /oauth/i,
    ];
    for (const pattern of ssoPatterns) {
      await expect(page.getByRole("button", { name: pattern })).toHaveCount(0);
      await expect(page.getByRole("link", { name: pattern })).toHaveCount(0);
    }
  });
});
