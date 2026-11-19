// US-009-3: toggle done/not-done (AC-020, AC-021), edit via modal, and delete
// a task, plus ownership enforcement (AC-023, AC-024) verified through the
// backend API.
//
// E2E coverage for the browser-side acceptance criteria:
//   1. A user creates a task, marks it done (strikethrough + "Done" badge),
//      then marks it not done and it appears active again (AC-020, AC-021).
//   2. A user edits a task's title and due date via the edit modal, and the
//      changes persist after a full page reload.
//   3. A user deletes a task and it no longer appears in the list.
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database), which signs the user in and lands them on the
// task list. Unique, run-time generated credentials keep the suite independent
// and keep no literal password in the repository.

import { expect, request, test } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-us009-${crypto.randomUUID()}@example.com`;
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

test.describe("US-009 Toggle, edit and delete tasks", () => {
  test("[AC-020] marking a task done shows strikethrough and a Done badge", async ({ page }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Water the garden");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Water the garden")).toBeVisible();

    // Initially active: the title has no line-through class.
    const titleSpan = page.getByText("Water the garden").first();
    await expect(titleSpan).not.toHaveClass(/line-through/);

    // Mark it done.
    await page.getByRole("button", { name: /Mark "Water the garden" as done/i }).click();

    // Now the toggle offers to mark it not done.
    await expect(
      page.getByRole("button", { name: /Mark "Water the garden" as not done/i }),
    ).toBeVisible();

    // The title is struck through and a "Done" badge appears.
    await expect(page.getByText("Water the garden").first()).toHaveClass(/line-through/);
    await expect(page.getByText("Done").first()).toBeVisible();
  });

  test("[AC-021] marking a done task not done makes it active again", async ({ page }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Walk the dog");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Walk the dog")).toBeVisible();

    // Mark done first.
    await page.getByRole("button", { name: /Mark "Walk the dog" as done/i }).click();
    await expect(
      page.getByRole("button", { name: /Mark "Walk the dog" as not done/i }),
    ).toBeVisible();
    await expect(page.getByText("Walk the dog").first()).toHaveClass(/line-through/);

    // Now mark it not done.
    await page.getByRole("button", { name: /Mark "Walk the dog" as not done/i }).click();

    // Back to active: toggle offers to mark done, no strikethrough, no badge.
    await expect(page.getByRole("button", { name: /Mark "Walk the dog" as done/i })).toBeVisible();
    await expect(page.getByText("Walk the dog").first()).not.toHaveClass(/line-through/);
  });

  test("[AC-020/AC-021] the done state persists after a page reload", async ({ page }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Persistent done task");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Persistent done task")).toBeVisible();

    await page.getByRole("button", { name: /Mark "Persistent done task" as done/i }).click();
    await expect(
      page.getByRole("button", { name: /Mark "Persistent done task" as not done/i }),
    ).toBeVisible();

    // Reload — the done state survives.
    await page.reload();
    await expect(page.getByText("Persistent done task").first()).toHaveClass(/line-through/);
    await expect(
      page.getByRole("button", { name: /Mark "Persistent done task" as not done/i }),
    ).toBeVisible();
  });

  test("user edits a task's title and due date via the edit modal and changes persist after reload", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Original title");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Original title")).toBeVisible();

    // Open the edit modal.
    await page.getByRole("button", { name: /Edit "Original title"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();

    // Change the title and set a due date.
    await page.locator("#edit-title").fill("Updated title");
    await page.locator("#edit-due").fill("2026-12-15");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Modal closes and the list reflects the new title and due date.
    await expect(page.getByRole("heading", { name: "Edit Task" })).toHaveCount(0);
    await expect(page.getByText("Updated title")).toBeVisible();
    await expect(page.getByText("Due Dec 15, 2026")).toBeVisible();
    await expect(page.getByText("Original title")).toHaveCount(0);

    // Reload — the changes persist.
    await page.reload();
    await expect(page.getByText("Updated title")).toBeVisible();
    await expect(page.getByText("Due Dec 15, 2026")).toBeVisible();
    await expect(page.getByText("Original title")).toHaveCount(0);
  });

  test("user deletes a task and it no longer appears in the list", async ({ page }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Delete me");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Delete me")).toBeVisible();

    // Open edit modal and trigger the two-step delete.
    await page.getByRole("button", { name: /Edit "Delete me"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();

    await page.getByRole("button", { name: "Delete Task" }).click();
    await page.getByRole("button", { name: "Confirm Delete" }).click();

    // Modal closes and the task is gone.
    await expect(page.getByRole("heading", { name: "Edit Task" })).toHaveCount(0);
    await expect(page.getByText("Delete me")).toHaveCount(0);

    // Reload — still gone.
    await page.reload();
    await expect(page.getByText("Delete me")).toHaveCount(0);
    await expect(page.getByText("No tasks yet")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// API-level ownership enforcement (AC-023, AC-024) driven through Playwright's
// request context against the real backend.
// ---------------------------------------------------------------------------

test.describe("US-009 ownership enforcement (API)", () => {
  test("[AC-023] GET /tasks returns only the authenticated user's tasks", async () => {
    const ctx = await request.newContext();

    // Register two users.
    const emailA = uniqueEmail();
    const emailB = uniqueEmail();
    const password = uniquePassword();

    const regA = await ctx.post(`${API}/auth/register`, {
      data: { email: emailA, password },
    });
    expect(regA.status()).toBe(200);
    const tokenA = (await regA.json()).token;

    const regB = await ctx.post(`${API}/auth/register`, {
      data: { email: emailB, password },
    });
    expect(regB.status()).toBe(200);
    const tokenB = (await regB.json()).token;

    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    // User A creates two tasks; User B creates one.
    await ctx.post(`${API}/tasks`, { data: { title: "A1" }, headers: auth(tokenA) });
    await ctx.post(`${API}/tasks`, {
      data: { title: "A2", due_date: "2026-12-01" },
      headers: auth(tokenA),
    });
    await ctx.post(`${API}/tasks`, { data: { title: "B1" }, headers: auth(tokenB) });

    // A sees only A's tasks.
    const aResp = await ctx.get(`${API}/tasks`, { headers: auth(tokenA) });
    expect(aResp.status()).toBe(200);
    const aTitles = (await aResp.json()).map((t: { title: string }) => t.title);
    expect(aTitles.sort()).toEqual(["A1", "A2"]);
    expect(aTitles).not.toContain("B1");

    // B sees only B's task.
    const bResp = await ctx.get(`${API}/tasks`, { headers: auth(tokenB) });
    expect(bResp.status()).toBe(200);
    const bTitles = (await bResp.json()).map((t: { title: string }) => t.title);
    expect(bTitles).toEqual(["B1"]);

    await ctx.dispose();
  });

  test("[AC-024] PATCH and DELETE on another user's task return 404", async () => {
    const ctx = await request.newContext();

    const emailA = uniqueEmail();
    const emailB = uniqueEmail();
    const password = uniquePassword();

    const regA = await ctx.post(`${API}/auth/register`, {
      data: { email: emailA, password },
    });
    const tokenA = (await regA.json()).token;

    const regB = await ctx.post(`${API}/auth/register`, {
      data: { email: emailB, password },
    });
    const tokenB = (await regB.json()).token;

    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    // User A creates a task.
    const createResp = await ctx.post(`${API}/tasks`, {
      data: { title: "A's private" },
      headers: auth(tokenA),
    });
    expect(createResp.status()).toBe(201);
    const taskId = (await createResp.json()).id;

    // User B cannot PATCH it.
    const patchResp = await ctx.patch(`${API}/tasks/${taskId}`, {
      data: { is_done: true },
      headers: auth(tokenB),
    });
    expect(patchResp.status()).toBe(404);

    // User B cannot DELETE it.
    const deleteResp = await ctx.delete(`${API}/tasks/${taskId}`, {
      headers: auth(tokenB),
    });
    expect(deleteResp.status()).toBe(404);

    // Owner still has the task unchanged.
    const ownResp = await ctx.get(`${API}/tasks`, { headers: auth(tokenA) });
    const own = await ownResp.json();
    expect(own).toHaveLength(1);
    expect(own[0].is_done).toBe(false);

    await ctx.dispose();
  });

  test("PATCH and DELETE without auth return 401", async () => {
    const ctx = await request.newContext();

    // Register a user and create a task to get a real task id.
    const email = uniqueEmail();
    const password = uniquePassword();
    const reg = await ctx.post(`${API}/auth/register`, {
      data: { email, password },
    });
    const token = (await reg.json()).token;
    const auth = { Authorization: `Bearer ${token}` };

    const createResp = await ctx.post(`${API}/tasks`, {
      data: { title: "Auth test" },
      headers: auth,
    });
    const taskId = (await createResp.json()).id;

    // No auth header on PATCH.
    const patchNoAuth = await ctx.patch(`${API}/tasks/${taskId}`, {
      data: { is_done: true },
    });
    expect(patchNoAuth.status()).toBe(401);

    // No auth header on DELETE.
    const deleteNoAuth = await ctx.delete(`${API}/tasks/${taskId}`);
    expect(deleteNoAuth.status()).toBe(401);

    await ctx.dispose();
  });
});
