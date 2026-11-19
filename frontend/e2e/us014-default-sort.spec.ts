// US-014: Default sort by due date then creation time.
//
// E2E coverage for the acceptance criteria:
//   AC-029 — tasks with different due dates appear ordered by due date
//            ascending under the default sort.
//   AC-030 — tasks sharing a due date are ordered by creation time, and tasks
//            without a due date are ordered among themselves by creation time.
//
// The browser-side criteria (what a person sees on the task list) are driven
// through the UI the way a user would: register, add tasks out of order, and
// read the displayed order. The pure API guarantee — GET /tasks returns the
// signed-in user's tasks sorted by due date ascending then creation time — is
// driven through Playwright's request API against the real backend.
//
// Each test registers a fresh account through the app's own register screen or
// the API (never seeds the database directly). Unique, run-time generated
// credentials keep the suite independent and keep no literal password in the
// repository.

import { expect, request, test } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-us014-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// Register through the UI and land on the task list, signed in.
async function registerAndLandOnTasks(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/register");
  await page.locator("#reg-email").fill(uniqueEmail());
  await page.locator("#reg-password").fill(uniquePassword());
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
}

// Register through the API and return the session token.
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

// Read the titles of active tasks in the order they are displayed, via the
// done-toggle buttons (their aria-labels carry the titles) in document order.
async function displayedActiveTitles(page: import("@playwright/test").Page): Promise<string[]> {
  const buttons = await page.getByRole("button", { name: /^Mark ".*" as done$/i }).all();
  const titles: string[] = [];
  for (const button of buttons) {
    const label = (await button.getAttribute("aria-label")) ?? "";
    const match = label.match(/^Mark "(.*)" as done$/i);
    if (match) titles.push(match[1]);
  }
  return titles;
}

// ---------------------------------------------------------------------------
// Browser-side acceptance criteria
// ---------------------------------------------------------------------------

test.describe("US-014 Default sort (browser)", () => {
  test("[AC-029] tasks with different due dates appear ordered by due date ascending", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Add tasks out of due-date order.
    await page.locator("#new-title").fill("December task");
    await page.locator("#new-due").fill("2026-12-10");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("October task");
    await page.locator("#new-due").fill("2026-10-15");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("November task");
    await page.locator("#new-due").fill("2026-11-01");
    await page.getByRole("button", { name: "Add Task" }).click();

    await expect(page.getByText("October task")).toBeVisible();

    // The list shows the tasks ordered by due date ascending.
    expect(await displayedActiveTitles(page)).toEqual([
      "October task",
      "November task",
      "December task",
    ]);
  });

  test("[AC-030] same-due-date tasks keep creation order and no-due-date tasks follow in creation order", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Three tasks sharing a due date, created in this order.
    await page.locator("#new-title").fill("Same A");
    await page.locator("#new-due").fill("2026-11-20");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Same B");
    await page.locator("#new-due").fill("2026-11-20");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("Same C");
    await page.locator("#new-due").fill("2026-11-20");
    await page.getByRole("button", { name: "Add Task" }).click();

    // Two tasks without a due date, created in this order.
    await page.locator("#new-title").fill("NoDue A");
    await page.getByRole("button", { name: "Add Task" }).click();

    await page.locator("#new-title").fill("NoDue B");
    await page.getByRole("button", { name: "Add Task" }).click();

    await expect(page.getByText("Same A")).toBeVisible();

    // Same-due-date tasks in creation order, then no-due-date tasks in creation
    // order (the frontend sorts no-due-date tasks last).
    expect(await displayedActiveTitles(page)).toEqual([
      "Same A",
      "Same B",
      "Same C",
      "NoDue A",
      "NoDue B",
    ]);
  });

  test("[NFR-007] tens of tasks with mixed due dates all render in the correct default sort order", async ({
    page,
  }) => {
    // NFR-007: the app is sized for individual low-scale use (tens to hundreds
    // of personal tasks). Tens is the verifiable lower bound through the UI;
    // hundreds would make the spec impractically slow. Create a mix of dated
    // and undated tasks in a deliberately scrambled creation order, then assert
    // the displayed list matches the expected due-date-ascending-then-creation-
    // time sort exactly — the sort must hold at this scale, not just for a few
    // rows.
    await registerAndLandOnTasks(page);

    // 20 dated tasks with due dates scrambled out of creation order (some due
    // dates repeat, exercising the creation-time tiebreak), then 10 undated
    // tasks created last.
    const dated = Array.from({ length: 20 }, (_, i) => ({
      title: `D-${String(i + 1).padStart(2, "0")}`,
      due: `2026-12-${String(((i * 7) % 28) + 1).padStart(2, "0")}`,
    }));
    const noDue = Array.from({ length: 10 }, (_, i) => ({
      title: `N-${String(i + 1).padStart(2, "0")}`,
      due: "",
    }));

    for (const t of [...dated, ...noDue]) {
      await page.locator("#new-title").fill(t.title);
      if (t.due) await page.locator("#new-due").fill(t.due);
      await page.getByRole("button", { name: "Add Task" }).click();
    }

    // Expected: dated tasks sorted by due_date ascending (stable, so equal due
    // dates keep creation order), then undated tasks in creation order.
    const expected = [
      ...[...dated].sort((a, b) => a.due.localeCompare(b.due)).map((t) => t.title),
      ...noDue.map((t) => t.title),
    ];

    await expect(page.getByText("N-10")).toBeVisible();
    expect(await displayedActiveTitles(page)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// API-level contract for GET /tasks default ordering
// ---------------------------------------------------------------------------

test.describe("US-014 GET /tasks default ordering (API)", () => {
  test("[AC-029] GET /tasks returns dated tasks ordered by due date ascending then creation time", async () => {
    const ctx = await request.newContext();
    const token = await apiRegister();
    const h = auth(token);

    // Create dated tasks out of order, including a shared due date.
    await ctx.post(`${API}/tasks`, { data: { title: "Late", due_date: "2026-12-10" }, headers: h });
    await ctx.post(`${API}/tasks`, {
      data: { title: "Early", due_date: "2026-11-01" },
      headers: h,
    });
    await ctx.post(`${API}/tasks`, {
      data: { title: "Same-A", due_date: "2026-11-20" },
      headers: h,
    });
    await ctx.post(`${API}/tasks`, {
      data: { title: "Same-B", due_date: "2026-11-20" },
      headers: h,
    });

    const resp = await ctx.get(`${API}/tasks`, { headers: h });
    expect(resp.status()).toBe(200);
    const body = await resp.json();

    const dated = body.filter((t: { due_date: string | null }) => t.due_date !== null);
    // Dated tasks are ordered by due_date ascending; the shared due date keeps
    // creation-time order (Same-A was created before Same-B).
    expect(dated.map((t: { title: string }) => t.title)).toEqual([
      "Early",
      "Same-A",
      "Same-B",
      "Late",
    ]);
    // due_date is non-decreasing across the dated block (the primary sort key).
    const dueDates = dated.map((t: { due_date: string }) => t.due_date);
    expect([...dueDates].sort()).toEqual(dueDates);
    // Within a shared due date, created_at is non-decreasing (the tiebreak).
    for (let i = 1; i < dated.length; i++) {
      if (dated[i].due_date === dated[i - 1].due_date) {
        expect(dated[i].created_at >= dated[i - 1].created_at).toBe(true);
      }
    }

    await ctx.dispose();
  });

  test("[AC-030] GET /tasks orders same-due-date and no-due-date tasks by creation time", async () => {
    const ctx = await request.newContext();
    const token = await apiRegister();
    const h = auth(token);

    // Two tasks sharing a due date, then two without a due date.
    await ctx.post(`${API}/tasks`, {
      data: { title: "Shared-A", due_date: "2026-11-20" },
      headers: h,
    });
    await ctx.post(`${API}/tasks`, {
      data: { title: "Shared-B", due_date: "2026-11-20" },
      headers: h,
    });
    await ctx.post(`${API}/tasks`, { data: { title: "NoDue-A" }, headers: h });
    await ctx.post(`${API}/tasks`, { data: { title: "NoDue-B" }, headers: h });

    const resp = await ctx.get(`${API}/tasks`, { headers: h });
    expect(resp.status()).toBe(200);
    const body = await resp.json();

    // Same-due-date tasks are ordered by creation time (insertion order here).
    const shared = body.filter((t: { due_date: string | null }) => t.due_date === "2026-11-20");
    expect(shared.map((t: { title: string }) => t.title)).toEqual(["Shared-A", "Shared-B"]);
    for (let i = 1; i < shared.length; i++) {
      expect(shared[i].created_at >= shared[i - 1].created_at).toBe(true);
    }

    // No-due-date tasks are ordered among themselves by creation time.
    const noDue = body.filter((t: { due_date: string | null }) => t.due_date === null);
    expect(noDue.map((t: { title: string }) => t.title)).toEqual(["NoDue-A", "NoDue-B"]);
    for (let i = 1; i < noDue.length; i++) {
      expect(noDue[i].created_at >= noDue[i - 1].created_at).toBe(true);
    }

    await ctx.dispose();
  });
});
