// US-004-3: password reset request (neutral confirmation) and confirm flow.
//
// E2E coverage for the three browser-side acceptance criteria:
//   1. /forgot-password: enter an email, see the neutral confirmation message
//      (NFR-004 — same message whether or not the email is registered).
//   2. /reset-password?token=<valid_token>: enter a new password, see success,
//      redirect to /sign-in.
//   3. After reset, the user can sign in with the new password.
//
// For the reset-confirm tests a valid reset token is created directly in the
// database (the request endpoint does not return the raw token, and
// SENDGRID_API_KEY is not configured in the sandbox so no email is sent). The
// `pg` client connects to the same PostgreSQL the running backend uses.

import { expect, request, test } from "@playwright/test";
import { Client } from "pg";
import { createHash, randomUUID } from "node:crypto";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

const NEUTRAL_MESSAGE = "If an account exists for this email, a password reset link has been sent.";

function uniqueEmail(): string {
  return `e2e-us004-${randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${randomUUID()}`;
}

// Convert the SQLAlchemy DATABASE_URL to a plain postgres URL the `pg` client
// accepts (strips the "+psycopg" driver suffix).
function pgConnectionString(): string {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("postgresql")) {
    throw new Error(
      "E2E reset tests require a PostgreSQL DATABASE_URL; got: " +
        (url ? url.replace(/:[^:@]+@/, ":***@") : "(empty)"),
    );
  }
  return url.replace("postgresql+psycopg://", "postgresql://");
}

// Insert a valid, unused, unexpired reset token for the given user and return
// the raw token string. The reset page needs the raw value; only its SHA-256
// hash is stored — matching how the backend stores and looks up tokens.
async function createResetToken(userId: string): Promise<string> {
  const rawToken = `${randomUUID()}${randomUUID()}`;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const client = new Client({ connectionString: pgConnectionString() });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO password_reset_tokens
         (id, user_id, token_hash, expires_at, used_at, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2, NOW() + INTERVAL '1 hour', NULL, NOW())`,
      [userId, tokenHash],
    );
  } finally {
    await client.end();
  }
  return rawToken;
}

// Register a user through the API and return the user id, email, and password.
async function registerUser(): Promise<{
  userId: string;
  email: string;
  password: string;
}> {
  const email = uniqueEmail();
  const password = uniquePassword();
  const ctx = await request.newContext();
  const resp = await ctx.post(`${API}/auth/register`, { data: { email, password } });
  expect(resp.status(), `register failed: ${resp.status()}`).toBe(200);
  const body = await resp.json();
  await ctx.dispose();
  return { userId: body.user.id, email, password };
}

test.describe("US-004 Password reset", () => {
  test("[AC-009/NFR-004] navigating to /forgot-password and entering an email shows the neutral confirmation message", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot Password" })).toBeVisible();

    await page.locator("#email").fill(uniqueEmail());
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    // The neutral confirmation message appears — identical whether or not the
    // email is registered (NFR-004: no account enumeration).
    await expect(page.getByText(NEUTRAL_MESSAGE)).toBeVisible();
  });

  test("[AC-011] navigating to /reset-password with a valid token shows success and redirects to /sign-in", async ({
    page,
  }) => {
    const user = await registerUser();
    const token = await createResetToken(user.userId);
    const newPassword = uniquePassword();

    await page.goto(`/reset-password?token=${token}`);
    await expect(page.getByRole("heading", { name: "Set New Password" })).toBeVisible();

    await page.locator("#new-password").fill(newPassword);
    await page.locator("#confirm-password").fill(newPassword);
    await page.getByRole("button", { name: "Reset Password" }).click();

    // Success message appears.
    await expect(page.getByRole("heading", { name: "Password Updated" })).toBeVisible();

    // The app redirects to /sign-in after a short delay.
    await expect(page).toHaveURL(/\/sign-in$/, { timeout: 5000 });
    await expect(page.locator("#signin-email")).toBeVisible();
  });

  test("[AC-011] after reset, the user can sign in with the new password", async ({ page }) => {
    const user = await registerUser();
    const token = await createResetToken(user.userId);
    const newPassword = uniquePassword();

    // Perform the reset through the confirm API endpoint.
    const ctx = await request.newContext();
    const confirmResp = await ctx.post(`${API}/auth/password-reset/confirm`, {
      data: { token, new_password: newPassword },
    });
    expect(confirmResp.status(), `confirm failed: ${confirmResp.status()}`).toBe(200);
    await ctx.dispose();

    // Sign in through the UI with the new password.
    await page.goto("/sign-in");
    await page.locator("#signin-email").fill(user.email);
    await page.locator("#signin-password").fill(newPassword);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
  });
});
