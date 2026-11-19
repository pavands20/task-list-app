// US-006 / AC-014: the app is free with no payments, billing or plans.
//
// This spec covers both halves of the criterion. The browser half drives the
// real flow a person performs -- registering, then using every task feature
// (add, complete, edit, delete) -- and asserts no payment, billing, plan,
// subscription, trial or upgrade prompt ever appears on screen. The API half
// drives the backend contract through Playwright's `request` API: a successful
// registration returns only the agreed { token, user: { id, email } } shape with
// no plan/billing fields, and no payment endpoint is routable.

import { expect, request, test } from "@playwright/test";

import { adminCredentials } from "./support/admin";

// The API lives on a different origin than the frontend's static server. The
// suite boots it at 127.0.0.1:8000; a deployed run points E2E_API_URL at it.
const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

// Payment-specific copy a paywall surfaces. Full phrases so a task title such
// as "Plan weekend trip" (contains "Plan") does not false-trigger, while
// "choose a plan" / "upgrade" / "billing details" do.
const PAYMENT_COPY = [
  "payment",
  "billing",
  "subscription",
  "upgrade",
  "downgrade",
  "pricing",
  "paywall",
  "stripe",
  "credit card",
  "card number",
  "free trial",
  "paid plan",
  "choose a plan",
  "your plan",
  "payment information",
  "payment method",
  "billing details",
];

function uniqueEmail(): string {
  return `e2e-free-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  return `pw-${crypto.randomUUID()}`;
}

// Assert no payment copy is visible anywhere on the page right now.
async function expectNoPaymentCopy(page: import("@playwright/test").Page): Promise<void> {
  const body = (await page.locator("body").textContent()) ?? "";
  const lower = body.toLowerCase();
  for (const term of PAYMENT_COPY) {
    expect(lower, `page mentioned payment term '${term}'`).not.toContain(term);
  }
  // No payment call-to-action in any actionable element.
  const actionPatterns = [
    /pay/i,
    /billing/i,
    /upgrade/i,
    /downgrade/i,
    /subscribe/i,
    /subscription/i,
    /choose a plan/i,
    /pricing/i,
    /free trial/i,
    /paid plan/i,
  ];
  for (const pattern of actionPatterns) {
    await expect(page.getByRole("button", { name: pattern })).toHaveCount(0);
    await expect(page.getByRole("link", { name: pattern })).toHaveCount(0);
  }
}

test.describe("US-006 Use the app free of charge", () => {
  test("[AC-014] registering and using every task feature never prompts for payment", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const password = uniquePassword();

    // Registration page: only email + password, no payment fields or prompts.
    await page.goto("/register");
    await expect(page.locator("#reg-email")).toBeVisible();
    await expect(page.locator("#reg-password")).toBeVisible();
    await expectNoPaymentCopy(page);

    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();

    // Lands on the task list with no paywall between register and the app.
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
    await expectNoPaymentCopy(page);

    // Add a task -- only a title and an optional due date are requested.
    await page.getByPlaceholder("What needs to be done?").fill("Read a book");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Read a book")).toBeVisible();
    await expectNoPaymentCopy(page);

    // Complete the task -- no "upgrade to mark done" gate.
    await page.getByRole("button", { name: /Mark "Read a book" as done/i }).click();
    await expect(
      page.getByRole("button", { name: /Mark "Read a book" as not done/i }),
    ).toBeVisible();
    await expectNoPaymentCopy(page);

    // Edit the task via the modal -- no payment fields inside the dialog.
    await page.getByRole("button", { name: /Edit "Read a book"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await expectNoPaymentCopy(page);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toHaveCount(0);
    await expectNoPaymentCopy(page);

    // Delete the task via the two-step confirm -- no payment wall on deletion.
    await page.getByRole("button", { name: /Edit "Read a book"/i }).click();
    await page.getByRole("button", { name: "Delete Task" }).click();
    await page.getByRole("button", { name: "Confirm Delete" }).click();
    await expect(page.getByText("Read a book")).toHaveCount(0);
    await expectNoPaymentCopy(page);
  });

  test("[AC-014] the registration API returns no plan or billing fields and no payment endpoint is routable", async () => {
    const ctx = await request.newContext();
    const email = uniqueEmail();
    const password = uniquePassword();

    const resp = await ctx.post(`${API}/auth/register`, {
      data: { email, password },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();

    // The agreed shape: a session token plus the public user. No plan, tier,
    // trial, billing or payment field is attached to the session.
    expect(Object.keys(body).sort()).toEqual(["token", "user"]);
    expect(Object.keys(body.user).sort()).toEqual(["email", "id"]);
    const serialised = JSON.stringify(body).toLowerCase();
    for (const term of PAYMENT_COPY) {
      expect(serialised, `register response mentioned '${term}'`).not.toContain(term);
    }

    // A client guessing payment URLs gets 404, never a billing flow or 402.
    const paymentPaths = [
      "/billing",
      "/payments",
      "/plans",
      "/subscriptions",
      "/checkout",
      "/pricing",
      "/upgrade",
      "/account/plan",
      "/account/billing",
      "/account/subscription",
    ];
    for (const path of paymentPaths) {
      const got = await ctx.get(`${API}${path}`);
      expect(got.status(), `GET ${path}`).toBe(404);
    }

    // The published contract advertises no payment endpoints either.
    const spec = await (await ctx.get(`${API}/openapi.json`)).json();
    const paths = Object.keys(spec.paths ?? {});
    const billing = paths.filter((p) =>
      /billing|payment|subscription|checkout|paywall|pricing|plans?|tiers?|upgrade|stripe/i.test(p),
    );
    expect(billing, "OpenAPI advertises billing/plan paths").toEqual([]);

    await ctx.dispose();
  });

  test("[AC-014] the bootstrap admin uses the app with no payment restriction", async () => {
    // The one admin every run has signs in and reaches the task list without
    // ever being asked for payment information.
    const { email, password } = adminCredentials();

    const ctx = await request.newContext();
    const resp = await ctx.post(`${API}/auth/login`, {
      data: { email, password },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Object.keys(body).sort()).toEqual(["token", "user"]);
    const serialised = JSON.stringify(body).toLowerCase();
    for (const term of PAYMENT_COPY) {
      expect(serialised, `login response mentioned '${term}'`).not.toContain(term);
    }
    await ctx.dispose();
  });

  test("[AC-014] the sign-in page shows no payment, billing or plan prompts", async ({ page }) => {
    // The sign-in screen must be as free of payment copy as registration and
    // the task list. Visit it directly and assert the page is clean.
    await page.goto("/sign-in");
    await expect(page.locator("#signin-email")).toBeVisible();
    await expect(page.locator("#signin-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expectNoPaymentCopy(page);
  });

  test("[AC-014] no paywall dialog or paid-plan restriction blocks any task feature", async ({
    page,
  }) => {
    // Drive the whole task lifecycle and assert no modal, banner or disabled
    // control ever gates a feature behind a paid plan. A paywall would surface
    // as a dialog/banner with payment copy or a disabled button; neither appears.
    const email = uniqueEmail();
    const password = uniquePassword();

    await page.goto("/register");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/tasks$/);

    // No paywall dialog is open on first arrival.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Adding a task is not restricted.
    const addBtn = page.getByRole("button", { name: "Add Task" });
    await expect(addBtn).toBeEnabled();
    await page.getByPlaceholder("What needs to be done?").fill("Restriction check task");
    await addBtn.click();
    await expect(page.getByText("Restriction check task")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoPaymentCopy(page);

    // Completing is not restricted.
    const doneBtn = page.getByRole("button", { name: /Mark "Restriction check task" as done/i });
    await expect(doneBtn).toBeEnabled();
    await doneBtn.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoPaymentCopy(page);

    // Editing is not restricted.
    await page.getByRole("button", { name: /Edit "Restriction check task"/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // The edit dialog contains only title/due fields — no payment upsell.
    await expectNoPaymentCopy(page);
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Delete Task" })).toBeEnabled();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoPaymentCopy(page);
  });

  test("[NFR-007] a user can manage tens of tasks with no paywall or restriction", async ({
    page,
  }) => {
    // NFR-007: the app is sized for individual users managing tens to hundreds
    // of personal tasks. Verify tens of tasks can be added and all render with
    // no payment prompt. Hundreds via the UI would make the spec impractically
    // slow; tens is the verifiable lower bound here (see notes in the report).
    const email = uniqueEmail();
    const password = uniquePassword();

    await page.goto("/register");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/tasks$/);

    const count = 30;
    for (let i = 0; i < count; i++) {
      await page.getByPlaceholder("What needs to be done?").fill(`Scalability task ${i + 1}`);
      await page.getByRole("button", { name: "Add Task" }).click();
    }
    await expectNoPaymentCopy(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Every added task is present and visible — no cap or paywall hid them.
    // exact: true so "Scalability task 1" does not also match "Scalability task 10".
    for (let i = 0; i < count; i++) {
      await expect(page.getByText(`Scalability task ${i + 1}`, { exact: true })).toBeVisible();
    }
  });
});
