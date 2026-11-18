// US-007 / AC-015, AC-016, AC-017, NFR-007: add a task with a required title
// and an optional due date.
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database directly), lands on the task list, and drives the
// add-task form the way a person does. Unique, run-time generated credentials
// keep the suite independent and keep no literal password in the repository.

import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-us007-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

// Register a fresh user through the UI and land on the task list.
async function registerAndLandOnTasks(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/register");
  await page.locator("#reg-email").fill(uniqueEmail());
  await page.locator("#reg-password").fill(uniquePassword());
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
}

test.describe("US-007 Add a task with a required title and optional due date", () => {
  test("[AC-015] a non-empty title and no due date creates an active task with no due date", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("Water the plants");
    await page.getByRole("button", { name: "Add Task" }).click();

    // The task appears in the list.
    await expect(page.getByText("Water the plants")).toBeVisible();

    // Active (not done): the toggle button offers to mark it done, and there
    // is no "Done" badge beside the title.
    await expect(
      page.getByRole("button", { name: /Mark "Water the plants" as done/i }),
    ).toBeVisible();
    await expect(page.getByText("Water the plants")).not.toHaveClass(/line-through/);

    // No due date: the due-date cell reads "No due date".
    await expect(page.getByText("No due date")).toBeVisible();

    // The title input is cleared after a successful add (ready for the next).
    await expect(page.locator("#new-title")).toHaveValue("");
    // No error is shown.
    await expect(page.locator("#new-title-err")).toHaveCount(0);
  });

  test("[AC-016] a non-empty title and a valid due date creates an active task with that due date", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("File taxes");
    await page.locator("#new-due").fill("2026-12-01");
    await page.getByRole("button", { name: "Add Task" }).click();

    // The task appears in the list and is active (not done).
    await expect(page.getByText("File taxes")).toBeVisible();
    await expect(page.getByRole("button", { name: /Mark "File taxes" as done/i })).toBeVisible();
    await expect(page.getByText("File taxes")).not.toHaveClass(/line-through/);

    // The due date is shown in the human-readable form the screen renders.
    // formatDate("2026-12-01") -> "Due Dec 1, 2026".
    await expect(page.getByText("Due Dec 1, 2026")).toBeVisible();

    // Both inputs are cleared after a successful add.
    await expect(page.locator("#new-title")).toHaveValue("");
    await expect(page.locator("#new-due")).toHaveValue("");
  });

  test("[AC-017] submitting without a title does not create a task and reports a title is required", async ({
    page,
  }) => {
    await registerAndLandOnTasks(page);

    // Click Add Task with an empty title.
    await page.getByRole("button", { name: "Add Task" }).click();

    // Stays on the task list (no navigation away).
    await expect(page).toHaveURL(/\/tasks$/);

    // A title-required message is shown to the user.
    await expect(page.locator("#new-title-err")).toBeVisible();
    await expect(page.locator("#new-title-err")).toContainText(/title is required/i);

    // The task list is still empty — no task was created.
    await expect(page.getByText("No tasks yet")).toBeVisible();
  });

  test("[AC-017] a whitespace-only title is treated as missing and rejected", async ({ page }) => {
    await registerAndLandOnTasks(page);

    await page.locator("#new-title").fill("   ");
    await page.getByRole("button", { name: "Add Task" }).click();

    await expect(page.locator("#new-title-err")).toBeVisible();
    await expect(page.locator("#new-title-err")).toContainText(/title is required/i);
    await expect(page.getByText("No tasks yet")).toBeVisible();
  });

  test("[AC-017] typing then clearing the title lets the error recover", async ({ page }) => {
    await registerAndLandOnTasks(page);

    // Trigger the error, then start typing to clear it.
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.locator("#new-title-err")).toBeVisible();

    await page.locator("#new-title").fill("Real task");
    await expect(page.locator("#new-title-err")).toHaveCount(0);

    // Now the same submission succeeds.
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Real task")).toBeVisible();
  });

  test("[NFR-007] a user can manage tens of tasks (with and without due dates) with no restriction", async ({
    page,
  }) => {
    // NFR-007: sized for individual low-scale use — tens to hundreds of personal
    // tasks. Tens is the verifiable lower bound through the UI; hundreds would
    // make the spec impractically slow. Add a mix with and without due dates and
    // confirm every one renders and stays active.
    await registerAndLandOnTasks(page);

    const count = 30;
    for (let i = 0; i < count; i++) {
      await page.locator("#new-title").fill(`US-007 task ${i + 1}`);
      if (i % 2 === 0) {
        await page.locator("#new-due").fill("2026-12-15");
      }
      await page.getByRole("button", { name: "Add Task" }).click();
    }

    // Every added task is present, visible, and active (mark-done offered).
    for (let i = 0; i < count; i++) {
      const title = `US-007 task ${i + 1}`;
      await expect(page.getByText(title).first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: new RegExp(`Mark "${title}" as done`, "i") }),
      ).toBeVisible();
    }
  });
});
