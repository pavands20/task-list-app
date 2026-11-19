// US-012: View my tasks in a single list.
//
// E2E coverage for the acceptance criteria:
//   AC-025 — opening the task list shows each task's title, its due date if
//            set, and whether it is done or active.
//   AC-026 — with no tasks, an empty-state message invites me to add my first.
//   AC-027 — selecting the Active filter shows only not-done tasks.
//   AC-028 — selecting the Completed filter shows only done tasks.
//
// The browser-side criteria (what a person sees and clicks) are driven through
// the UI the way a user would. The pure API guarantee — GET /tasks returns the
// signed-in user's tasks with the approved response shape — is driven through
// Playwright's request API against the real backend.
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database), which signs the user in and lands them on the
// task list. Unique, run-time generated credentials keep the suite independent
// and keep no literal password in the repository.

import { expect, request, test } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-us012-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

// Register a fresh user through the UI and land on the task list, signed in.
async function registerAndLandOnTasks(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/register");
  await page.locator("#reg-email").fill(uniqueEmail());
  await page.locator("#reg-password").fill(uniquePassword());
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// Register through the API and return the session token, for tests that prefer
// to set up data through the request context.
async function apiRegister(): Promise<string> {
  const ctx = await request.newContext();
  const resp = await ctx.post(`${API}/auth/register`, {
    data: { email: uniqueEmail(), password: uniquePassword() },
  });
  expect(resp.status()).toBe(200);
  const token = (await resp.json()).token;
  await ctx.dispose();
  return token;
}

// ---------------------------------------------------------------------------
// Browser-side acceptance criteria
// ---------------------------------------------------------------------------

test.describe("US-012 View my tasks (browser)", () => {
  test("[AC-025] opening the task list shows each task's title, due date and done/active status", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Create a mix of tasks: with/without due dates, active/done.
    await page.locator("#new-title").fill("Submit report");
    await page.locator("#new-due").fill("2026-11-25");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Call mom");
    await page.getByRole("button", { name: "Add Task" }).click();

    // Mark "Submit report" as done so the list has both active and completed.
    await page.getByRole("button", { name: /Mark "Submit report" as done/i }).click();

    // Every title is visible.
    await expect(page.getByText("Submit report")).toBeVisible();
    await expect(page.getByText("Call mom")).toBeVisible();

    // Due date is shown when set; "No due date" when not.
    await expect(page.getByText("Due Nov 25, 2026")).toBeVisible();
    await expect(page.getByText("No due date")).toBeVisible();

    // Done/active status: the completed task shows a "Done" badge and the done
    // toggle reflects the state. Use exact matching so the badge is not confused
    // with any task title that happens to contain the word "Done".
    await expect(page.getByText("Done", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Mark "Submit report" as not done/i }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /Mark "Call mom" as done/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("[AC-026] with no tasks yet the list shows an empty-state message inviting me to add my first task", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // A brand-new user has no tasks.
    await expect(page.getByText("No tasks yet")).toBeVisible();
    await expect(page.getByText(/Add your first task/i)).toBeVisible();
    // No task rows are rendered.
    await expect(page.getByRole("button", { name: /Mark .* as done/i })).toHaveCount(0);
  });

  test("[AC-027] selecting the active filter shows only tasks that are not done", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Create two active and two completed tasks through the UI.
    await page.locator("#new-title").fill("Active one");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Active two");
    await page.locator("#new-due").fill("2026-11-30");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Done one");
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: /Mark "Done one" as done/i }).click();

    await page.locator("#new-title").fill("Done two");
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: /Mark "Done two" as done/i }).click();

    await expect(page.getByText("Active one")).toBeVisible();

    // Select the Active filter.
    await page
      .getByRole("group", { name: /Filter tasks/i })
      .getByRole("button", { name: "Active" })
      .click();

    // Only active tasks remain; completed tasks are hidden.
    await expect(page.getByText("Active one")).toBeVisible();
    await expect(page.getByText("Active two")).toBeVisible();
    await expect(page.getByText("Done one")).toHaveCount(0);
    await expect(page.getByText("Done two")).toHaveCount(0);
    // No "Done" badges in the active-filtered view. Use exact matching so the
    // assertion counts only the badge spans, never task titles containing "Done".
    await expect(page.getByText("Done", { exact: true })).toHaveCount(0);
  });

  test("[AC-028] selecting the completed filter shows only tasks that are done", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Create two active and two completed tasks through the UI.
    await page.locator("#new-title").fill("Active one");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Active two");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Done one");
    await page.locator("#new-due").fill("2026-12-05");
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: /Mark "Done one" as done/i }).click();

    await page.locator("#new-title").fill("Done two");
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: /Mark "Done two" as done/i }).click();

    await expect(page.getByText("Active one")).toBeVisible();

    // Select the Completed filter.
    await page
      .getByRole("group", { name: /Filter tasks/i })
      .getByRole("button", { name: "Completed" })
      .click();

    // Only completed tasks remain; active tasks are hidden.
    await expect(page.getByText("Done one")).toBeVisible();
    await expect(page.getByText("Done two")).toBeVisible();
    await expect(page.getByText("Active one")).toHaveCount(0);
    await expect(page.getByText("Active two")).toHaveCount(0);
    // Both completed tasks show the "Done" badge. Use exact matching so the count
    // covers only the badge spans, not the "Done one"/"Done two" task titles.
    await expect(page.getByText("Done", { exact: true })).toHaveCount(2);
  });
});

// ---------------------------------------------------------------------------
// API-level contract for GET /tasks (response shape, auth, empty list)
// ---------------------------------------------------------------------------

test.describe("US-012 GET /tasks contract (API)", () => {
  test("[AC-025] GET /tasks returns each task with id, title, due_date, is_done and created_at", async () => {
    const ctx = await request.newContext();
    const token = await apiRegister();

    await ctx.post(`${API}/tasks`, {
      data: { title: "With due date", due_date: "2026-11-25" },
      headers: auth(token),
    });
    await ctx.post(`${API}/tasks`, { data: { title: "No due date" }, headers: auth(token) });

    const resp = await ctx.get(`${API}/tasks`, { headers: auth(token) });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);

    for (const t of body) {
      expect(typeof t.id).toBe("string");
      expect(t.id.length).toBeGreaterThan(0);
      expect(typeof t.title).toBe("string");
      expect(typeof t.is_done).toBe("boolean");
      expect(typeof t.created_at).toBe("string");
      // due_date is either a date string or null.
      expect(t.due_date === null || typeof t.due_date === "string").toBe(true);
    }

    await ctx.dispose();
  });

  test("[AC-026] GET /tasks returns an empty array for a user with no tasks", async () => {
    const ctx = await request.newContext();
    const token = await apiRegister();

    const resp = await ctx.get(`${API}/tasks`, { headers: auth(token) });
    expect(resp.status()).toBe(200);
    expect(await resp.json()).toEqual([]);

    await ctx.dispose();
  });

  test("GET /tasks without a Bearer token returns 401", async () => {
    const ctx = await request.newContext();
    const resp = await ctx.get(`${API}/tasks`);
    expect(resp.status()).toBe(401);
    await ctx.dispose();
  });

  test("GET /tasks with an invalid Bearer token returns 401", async () => {
    const ctx = await request.newContext();
    const resp = await ctx.get(`${API}/tasks`, { headers: auth("not-a-real-token") });
    expect(resp.status()).toBe(401);
    await ctx.dispose();
  });

  test("GET /tasks returns only the authenticated user's tasks", async () => {
    const ctx = await request.newContext();
    const tokenA = await apiRegister();
    const tokenB = await apiRegister();

    await ctx.post(`${API}/tasks`, { data: { title: "A1" }, headers: auth(tokenA) });
    await ctx.post(`${API}/tasks`, {
      data: { title: "A2", due_date: "2026-12-01" },
      headers: auth(tokenA),
    });
    await ctx.post(`${API}/tasks`, { data: { title: "B1" }, headers: auth(tokenB) });

    const aResp = await ctx.get(`${API}/tasks`, { headers: auth(tokenA) });
    expect(aResp.status()).toBe(200);
    const aTitles = (await aResp.json()).map((t: { title: string }) => t.title);
    expect(aTitles.sort()).toEqual(["A1", "A2"]);
    expect(aTitles).not.toContain("B1");

    const bResp = await ctx.get(`${API}/tasks`, { headers: auth(tokenB) });
    expect(bResp.status()).toBe(200);
    const bTitles = (await bResp.json()).map((t: { title: string }) => t.title);
    expect(bTitles).toEqual(["B1"]);

    await ctx.dispose();
  });
});
