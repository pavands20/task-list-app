// US-015-2 / AC-031, NFR-008: the task list and task actions stay usable and
// readable on small mobile screens through to large desktop screens without
// horizontal scrolling.
//
// E2E coverage for the acceptance criteria:
//   1. Open the task list on a 375x667 mobile viewport; the document body has
//      no horizontal scroll (scrollWidth <= clientWidth).
//   2. Open the task list on a 1920x1080 desktop viewport; no horizontal scroll.
//   3. On the mobile viewport, add a task, edit a task, toggle done, and delete
//      a task — every action completes without horizontal scrolling appearing.
//   4. On the mobile viewport, the filter tabs (All / Active / Completed) are
//      visible and functional without horizontal scroll.
//
// Each test registers a fresh account through the app's own register screen
// (never seeds the database directly), which signs the user in and lands them
// on the task list. Unique, run-time generated credentials keep the suite
// independent and keep no literal password in the repository.

import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-us015-${crypto.randomUUID()}@example.com`;
}

function uniquePassword(): string {
  // Long enough to clear the client-side 8-character minimum.
  return `pw-${crypto.randomUUID()}`;
}

// Viewports named by the acceptance criteria.
const MOBILE = { width: 375, height: 667 };
const DESKTOP = { width: 1920, height: 1080 };

// Assert the page has no horizontal scroll. Checks both documentElement and
// body so a stray overflow on either is caught. A small tolerance of 1px keeps
// the assertion robust against sub-pixel rounding in Chromium.
async function expectNoHorizontalScroll(page: import("@playwright/test").Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const body = document.body;
    return {
      deScroll: de.scrollWidth,
      deClient: de.clientWidth,
      bodyScroll: body.scrollWidth,
      bodyClient: body.clientWidth,
    };
  });
  expect(
    overflow.deScroll,
    `documentElement scrollWidth (${overflow.deScroll}) exceeds clientWidth (${overflow.deClient})`,
  ).toBeLessThanOrEqual(overflow.deClient + 1);
  expect(
    overflow.bodyScroll,
    `body scrollWidth (${overflow.bodyScroll}) exceeds clientWidth (${overflow.bodyClient})`,
  ).toBeLessThanOrEqual(overflow.bodyClient + 1);
}

// Register a fresh user through the UI and land on the task list, signed in.
// Sets the viewport before navigating so the responsive layout applies from
// the first paint.
async function registerAtViewport(
  page: import("@playwright/test").Page,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto("/register");
  await page.locator("#reg-email").fill(uniqueEmail());
  await page.locator("#reg-password").fill(uniquePassword());
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
}

test.describe("US-015 / NFR-008 responsive task list — no horizontal scrolling", () => {
  test("[AC-031/NFR-008] the task list has no horizontal scroll on a 375x667 mobile viewport", async ({
    page,
  }) => {
    await registerAtViewport(page, MOBILE);

    // Empty list: no horizontal scroll on the empty state.
    await expect(page.getByText("No tasks yet")).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Add a task with a long-ish title so wrapping is exercised, then re-check.
    await page.locator("#new-title").fill("Buy groceries for the week and pick up dry cleaning");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(
      page.getByText("Buy groceries for the week and pick up dry cleaning"),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("[AC-031/NFR-008] the task list has no horizontal scroll on a 1920x1080 desktop viewport", async ({
    page,
  }) => {
    await registerAtViewport(page, DESKTOP);

    await expect(page.getByText("No tasks yet")).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Add several tasks with due dates so the table renders with content at
    // the wide viewport, then re-check the overflow invariant.
    for (let i = 0; i < 5; i++) {
      await page.locator("#new-title").fill(`Desktop task number ${i + 1}`);
      await page.locator("#new-due").fill(`2026-12-${String(i + 1).padStart(2, "0")}`);
      await page.getByRole("button", { name: "Add Task" }).click();
    }
    await expect(page.getByText("Desktop task number 5")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("[AC-031/NFR-008] on mobile, add / edit / toggle done / delete all complete without horizontal scrolling", async ({
    page,
  }) => {
    await registerAtViewport(page, MOBILE);

    // --- Add a task ---
    await page.locator("#new-title").fill("Mobile responsive task");
    await page.getByRole("button", { name: "Add Task" }).click();
    await expect(page.getByText("Mobile responsive task")).toBeVisible();
    await expectNoHorizontalScroll(page);

    // --- Toggle done ---
    await page.getByRole("button", { name: /Mark "Mobile responsive task" as done/i }).click();
    await expect(
      page.getByRole("button", { name: /Mark "Mobile responsive task" as not done/i }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);

    // --- Edit the task via the modal ---
    await page.getByRole("button", { name: /Edit "Mobile responsive task"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    // The modal itself must not introduce horizontal scroll.
    await expectNoHorizontalScroll(page);
    await page.locator("#edit-title").fill("Mobile edited task");
    await page.locator("#edit-due").fill("2026-12-20");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toHaveCount(0);
    await expect(page.getByText("Mobile edited task")).toBeVisible();
    await expectNoHorizontalScroll(page);

    // --- Delete the task via the two-step confirm ---
    await page.getByRole("button", { name: /Edit "Mobile edited task"/i }).click();
    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole("button", { name: "Delete Task" }).click();
    await page.getByRole("button", { name: "Confirm Delete" }).click();
    await expect(page.getByText("Mobile edited task")).toHaveCount(0);
    await expect(page.getByText("No tasks yet")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("[AC-031/NFR-008] on mobile, the filter tabs are visible and functional without horizontal scroll", async ({
    page,
  }) => {
    await registerAtViewport(page, MOBILE);

    // Create a mix of active and completed tasks so each filter has content.
    await page.locator("#new-title").fill("Active one");
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.locator("#new-title").fill("Done one");
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByRole("button", { name: /Mark "Done one" as done/i }).click();
    await expect(page.getByRole("button", { name: /Mark "Done one" as not done/i })).toBeVisible();

    // The filter tab group is visible on the mobile viewport (no overflow
    // hid it) and the whole list has no horizontal scroll.
    const filterGroup = page.getByRole("group", { name: /Filter tasks/i });
    await expect(filterGroup).toBeVisible();
    await expectNoHorizontalScroll(page);

    // The Active filter shows only the not-done task.
    await filterGroup.getByRole("button", { name: "Active" }).click();
    await expect(page.getByText("Active one")).toBeVisible();
    await expect(page.getByText("Done one")).toHaveCount(0);
    await expectNoHorizontalScroll(page);

    // The Completed filter shows only the done task.
    await filterGroup.getByRole("button", { name: "Completed" }).click();
    await expect(page.getByText("Done one")).toBeVisible();
    await expect(page.getByText("Active one")).toHaveCount(0);
    await expectNoHorizontalScroll(page);

    // The All filter shows both again.
    await filterGroup.getByRole("button", { name: "All" }).click();
    await expect(page.getByText("Active one")).toBeVisible();
    await expect(page.getByText("Done one")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
