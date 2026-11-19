// US-008: Edit a task — change a task's title or due date (AC-018), reject an
// empty title with a "title is required" message (AC-019), and the API contract
// for PATCH /tasks/{task_id} driven through Playwright's request context.
//
// The browser-side criteria a person performs (clear a due date, clear a title)
// are driven through the UI the way a user would; the pure API guarantees
// (response shape, the title-required rejection a client depends on) are driven
// through the request API against the real backend.
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database), which signs the user in and lands them on the
// task list. Unique, run-time generated credentials keep the suite independent
// and keep no literal password in the repository.

import { expect, request, test } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-us008-${crypto.randomUUID()}@example.com`;
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

test.describe("US-008 Edit a task (browser)", () => {
  test("[AC-018] clearing the due date in the edit modal removes it and the change persists after reload", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Create a task that has a due date.
    await page.locator("#new-title").fill("File taxes");
    await page.locator("#new-due").fill("2026-12-20");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Due Dec 20, 2026")).toBeVisible();

    // Open the edit modal and clear the due date.
    await page.getByRole("button", { name: /Edit "File taxes"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await page.locator("#edit-due").fill("");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // The modal closes and the list reflects the cleared due date.
    await expect(page.getByRole("heading", { name: "Edit Task" })).toHaveCount(0);
    await expect(page.getByText("No due date")).toBeVisible();
    await expect(page.getByText("Due Dec 20, 2026")).toHaveCount(0);

    // Reload — the change survives.
    await page.reload();
    await expect(page.getByText("File taxes")).toBeVisible();
    await expect(page.getByText("No due date")).toBeVisible();
    await expect(page.getByText("Due Dec 20, 2026")).toHaveCount(0);
  });

  test("[AC-018] editing only the title leaves the due date untouched and persists", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Original");
    await page.locator("#new-due").fill("2026-12-20");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Due Dec 20, 2026")).toBeVisible();

    await page.getByRole("button", { name: /Edit "Original"/i }).click();
    await page.locator("#edit-title").fill("Renamed");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // The title changed; the due date is still there.
    await expect(page.getByText("Renamed")).toBeVisible();
    await expect(page.getByText("Original")).toHaveCount(0);
    await expect(page.getByText("Due Dec 20, 2026")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Renamed")).toBeVisible();
    await expect(page.getByText("Due Dec 20, 2026")).toBeVisible();
  });

  test("[AC-019] clearing the title in the edit modal is rejected and the task is unchanged", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Keep my title");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Keep my title")).toBeVisible();

    // Open the edit modal and clear the title.
    await page.getByRole("button", { name: /Edit "Keep my title"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await page.locator("#edit-title").fill("");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // The user is told a title is required; the modal stays open so they can fix it.
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/Title is required/i)).toBeVisible();

    // Close the modal without saving.
    await page.keyboard.press("Escape");

    // The task in the list is unchanged.
    await expect(page.getByText("Keep my title")).toBeVisible();

    // Reload — still unchanged.
    await page.reload();
    await expect(page.getByText("Keep my title")).toBeVisible();
  });

  test("[AC-022] deleting a task permanently removes it from the list and it stays gone after reload", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Delete me permanently");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Delete me permanently")).toBeVisible();

    // Open the edit modal and trigger the two-step delete.
    await page.getByRole("button", { name: /Edit "Delete me permanently"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await page.getByRole("button", { name: "Delete Task" }).click();
    await page.getByRole("button", { name: "Confirm Delete" }).click();

    // Modal closes and the task is gone from the list.
    await expect(page.getByRole("heading", { name: "Edit Task" })).toHaveCount(0);
    await expect(page.getByText("Delete me permanently")).toHaveCount(0);
    await expect(page.getByText("No tasks yet")).toBeVisible();

    // Reload — the task is permanently removed, not just hidden.
    await page.reload();
    await expect(page.getByText("Delete me permanently")).toHaveCount(0);
    await expect(page.getByText("No tasks yet")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// API contract for PATCH /tasks/{task_id} and DELETE /tasks/{task_id} driven
// through Playwright's request context against the real backend: the response
// shape a client depends on and the title-required rejection a person never
// sees but the client must handle.
// ---------------------------------------------------------------------------

test.describe("US-008 PATCH /tasks/{id} contract (API)", () => {
  test("[AC-018] PATCH returns 200 with { id, title, due_date, is_done }", async () => {
    const ctx = await request.newContext();

    const reg = await ctx.post(`${API}/auth/register`, {
      data: { email: uniqueEmail(), password: uniquePassword() },
    });
    expect(reg.status()).toBe(200);
    const token = (await reg.json()).token;
    const auth = { Authorization: `Bearer ${token}` };

    const created = await ctx.post(`${API}/tasks`, {
      data: { title: "Draft" },
      headers: auth,
    });
    expect(created.status()).toBe(201);
    const taskId = (await created.json()).id;

    const resp = await ctx.patch(`${API}/tasks/${taskId}`, {
      data: { title: "Final", due_date: "2026-12-01" },
      headers: auth,
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    // The approved response shape.
    expect(body.id).toBe(taskId);
    expect(body.title).toBe("Final");
    expect(body.due_date).toBe("2026-12-01");
    expect(body.is_done).toBe(false);

    await ctx.dispose();
  });

  test("[AC-018] PATCH clears the due date with due_date: null", async () => {
    const ctx = await request.newContext();

    const reg = await ctx.post(`${API}/auth/register`, {
      data: { email: uniqueEmail(), password: uniquePassword() },
    });
    const token = (await reg.json()).token;
    const auth = { Authorization: `Bearer ${token}` };

    const created = await ctx.post(`${API}/tasks`, {
      data: { title: "With date", due_date: "2026-12-01" },
      headers: auth,
    });
    const taskId = (await created.json()).id;

    const resp = await ctx.patch(`${API}/tasks/${taskId}`, {
      data: { due_date: null },
      headers: auth,
    });
    expect(resp.status()).toBe(200);
    expect((await resp.json()).due_date).toBeNull();

    await ctx.dispose();
  });

  test("[AC-019] PATCH with an empty title is rejected with a title-required error and leaves the task unchanged", async () => {
    const ctx = await request.newContext();

    const reg = await ctx.post(`${API}/auth/register`, {
      data: { email: uniqueEmail(), password: uniquePassword() },
    });
    const token = (await reg.json()).token;
    const auth = { Authorization: `Bearer ${token}` };

    const created = await ctx.post(`${API}/tasks`, {
      data: { title: "Keep" },
      headers: auth,
    });
    const taskId = (await created.json()).id;

    const resp = await ctx.patch(`${API}/tasks/${taskId}`, {
      data: { title: "   " },
      headers: auth,
    });
    // Rejected: the change is not applied.
    expect(resp.status()).toBe(400);
    expect((await resp.json()).detail).toBe("Title is required");

    // The task is unchanged.
    const list = await (await ctx.get(`${API}/tasks`, { headers: auth })).json();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Keep");

    await ctx.dispose();
  });

  test("[AC-022] DELETE returns 204 and the task is permanently removed", async () => {
    const ctx = await request.newContext();

    const reg = await ctx.post(`${API}/auth/register`, {
      data: { email: uniqueEmail(), password: uniquePassword() },
    });
    const token = (await reg.json()).token;
    const auth = { Authorization: `Bearer ${token}` };

    const created = await ctx.post(`${API}/tasks`, {
      data: { title: "Gone forever" },
      headers: auth,
    });
    const taskId = (await created.json()).id;

    // The task exists before deletion.
    let list = await (await ctx.get(`${API}/tasks`, { headers: auth })).json();
    expect(list).toHaveLength(1);

    const resp = await ctx.delete(`${API}/tasks/${taskId}`, { headers: auth });
    expect(resp.status()).toBe(204);
    expect(await resp.text()).toBe("");

    // The task is permanently removed — the list is empty.
    list = await (await ctx.get(`${API}/tasks`, { headers: auth })).json();
    expect(list).toEqual([]);

    // Fetching the deleted task by id is gone (404).
    const gone = await ctx.get(`${API}/tasks`, { headers: auth });
    expect(gone.status()).toBe(200);
    expect(await gone.json()).toHaveLength(0);

    await ctx.dispose();
  });
});
