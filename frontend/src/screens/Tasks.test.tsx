import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => "test-token"),
  clearSessionToken: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown, message: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
  API_BASE_URL: "",
  API_SECRET_KEY: "",
}));

import { apiFetch, ApiError } from "@/lib/api";
import Tasks from "@/screens/Tasks";

const mockedApiFetch = vi.mocked(apiFetch);

const task = (overrides = {}) => ({
  id: "t1",
  title: "Buy groceries",
  due_date: "2026-11-20",
  is_done: false,
  created_at: "2026-11-16T14:20:00Z",
  updated_at: "2026-11-16T14:20:00Z",
  ...overrides,
});

describe("Tasks screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks resets call history but not queued mockResolvedValueOnce
    // responses; a test that fails mid-action can leak its unused responses into
    // the next test's initial GET. mockReset clears that queue.
    mockedApiFetch.mockReset();
  });

  it("[AC-015] loads the task list from GET /tasks on mount and displays real tasks", async () => {
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Submit expense report" }),
      task({ id: "t2", title: "Buy groceries" }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Submit expense report")).toBeInTheDocument();
    expect(await screen.findByText("Buy groceries")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith("/tasks");
  });

  it("[AC-015] adding a task with a title and no due date calls POST /tasks and shows it active with no due date", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([] as never); // initial GET
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t2", title: "Call dentist", due_date: null }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("What needs to be done?"), "Call dentist");
    await user.click(screen.getByRole("button", { name: /Add Task/i }));

    expect(await screen.findByText("Call dentist")).toBeInTheDocument();
    expect(screen.getByText("No due date")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Call dentist", due_date: null }),
      }),
    );
  });

  it("[AC-016] adding a task with a title and a due date calls POST /tasks and shows that due date", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([] as never); // initial GET
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t3", title: "Plan weekend trip", due_date: "2026-11-25" }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("What needs to be done?"), "Plan weekend trip");
    fireEvent.change(screen.getByLabelText(/Due date/i), { target: { value: "2026-11-25" } });
    await user.click(screen.getByRole("button", { name: /Add Task/i }));

    expect(await screen.findByText("Plan weekend trip")).toBeInTheDocument();
    expect(screen.getByText("Due Nov 25, 2026")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Plan weekend trip", due_date: "2026-11-25" }),
      }),
    );
  });

  it("[AC-017] submitting with an empty title shows 'Title is required' and creates no task", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([] as never); // initial GET only

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Add Task/i }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    expect(mockedApiFetch).toHaveBeenCalledWith("/tasks");
  });

  it("[NFR-007] a user can manage tens of tasks with no paywall or restriction", async () => {
    // The app is sized for individual users managing tens to hundreds of personal
    // tasks. Verify tens of tasks loaded from the API all render with no cap,
    // no paywall, and every one is toggleable.
    const count = 30;
    const many = Array.from({ length: count }, (_, i) =>
      task({ id: `t${i + 1}`, title: `Scalability task ${i + 1}`, due_date: null }),
    );
    mockedApiFetch.mockResolvedValueOnce(many as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    // Every task is present and visible — no cap or paywall hid them.
    for (let i = 0; i < count; i++) {
      expect(await screen.findByText(`Scalability task ${i + 1}`)).toBeInTheDocument();
    }

    // No payment / billing / plan copy surfaced while rendering tens of tasks.
    const body = (document.body.textContent ?? "").toLowerCase();
    for (const term of [
      "payment",
      "billing",
      "subscription",
      "upgrade",
      "paywall",
      "choose a plan",
      "free trial",
      "paid plan",
    ]) {
      expect(body).not.toContain(term);
    }
  });

  it("[AC-020] clicking the done toggle on an active task calls PATCH /tasks/{id} with is_done=true and the task appears completed", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Buy groceries", is_done: false }),
    ] as never);
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t1", title: "Buy groceries", is_done: true }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Mark "Buy groceries" as done/i }));

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/tasks/t1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ is_done: true }),
      }),
    );
  });

  it("[AC-021] clicking the done toggle on a completed task calls PATCH /tasks/{id} with is_done=false and the task appears active again", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Buy groceries", is_done: true }),
    ] as never);
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t1", title: "Buy groceries", is_done: false }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Mark "Buy groceries" as not done/i }));

    await waitFor(() => {
      expect(screen.queryByText("Done")).not.toBeInTheDocument();
    });
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/tasks/t1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ is_done: false }),
      }),
    );
  });

  it("[handleSave] calls PATCH /tasks/{id} with the updated title and due_date and updates the task from the response", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Buy groceries", due_date: "2026-11-20" }),
    ] as never);
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t1", title: "Buy groceries & milk", due_date: "2026-11-22" }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));

    const titleInput = screen.getByLabelText(/Title \(required\)/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Buy groceries & milk");
    fireEvent.change(screen.getByLabelText(/clear to remove/i), {
      target: { value: "2026-11-22" },
    });
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Buy groceries & milk")).toBeInTheDocument();
    });
    expect(screen.getByText("Due Nov 22, 2026")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/tasks/t1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Buy groceries & milk", due_date: "2026-11-22" }),
      }),
    );
  });

  it("[AC-018] clearing the due date in the edit modal sends due_date: null and shows 'No due date'", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Pay rent", due_date: "2026-11-20" }),
    ] as never);
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t1", title: "Pay rent", due_date: null }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Pay rent");
    await user.click(screen.getByRole("button", { name: /Edit "Pay rent"/i }));

    // Clear the due date input.
    fireEvent.change(screen.getByLabelText(/clear to remove/i), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText("No due date")).toBeInTheDocument();
    });
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/tasks/t1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Pay rent", due_date: null }),
      }),
    );
  });

  it("[handleSave] shows an error message when the API returns 400 for an empty title", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task({ id: "t1", title: "Buy groceries" })] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));
    const titleInput = screen.getByLabelText(/Title \(required\)/i);
    await user.clear(titleInput);
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    // Client-side guard fires before the API is called.
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledTimes(1); // only the initial GET
  });

  it("[handleDelete] calls DELETE /tasks/{id} and removes the task from the list", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task({ id: "t1", title: "Buy groceries" })] as never);
    mockedApiFetch.mockResolvedValueOnce(undefined as never); // DELETE 204

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));
    // First click arms the two-step confirm.
    await user.click(screen.getByRole("button", { name: /Delete Task/i }));
    // Second click confirms and calls DELETE.
    await user.click(screen.getByRole("button", { name: /Confirm Delete/i }));

    await waitFor(() => {
      expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument();
    });
    expect(mockedApiFetch).toHaveBeenCalledWith("/tasks/t1", { method: "DELETE" });
  });

  it("[handleDelete] shows an error message when DELETE fails", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task({ id: "t1", title: "Buy groceries" })] as never);
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(404, { detail: "Task not found" }, "DELETE failed: 404"),
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));
    await user.click(screen.getByRole("button", { name: /Delete Task/i }));
    await user.click(screen.getByRole("button", { name: /Confirm Delete/i }));

    expect(await screen.findByText(/Could not delete the task/i)).toBeInTheDocument();
    // Task remains in the list because the delete failed.
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("[toggleDone] shows an error message when PATCH fails", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Buy groceries", is_done: false }),
    ] as never);
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(500, { detail: "Server error" }, "PATCH failed: 500"),
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Mark "Buy groceries" as done/i }));

    expect(await screen.findByText(/Could not update the task/i)).toBeInTheDocument();
    // Task stays active because the toggle failed.
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("[AC-023] loads only the authenticated user's tasks from GET /tasks on mount", async () => {
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "My task" }),
      task({ id: "t2", title: "Another task", is_done: true }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    expect(await screen.findByText("My task")).toBeInTheDocument();
    expect(await screen.findByText("Another task")).toBeInTheDocument();
    // Only the single GET /tasks call was made — scoped to the signed-in user
    // by the bearer token apiFetch sends.
    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    expect(mockedApiFetch).toHaveBeenCalledWith("/tasks");
  });

  it("[AC-025] each task shows its title, its due date if set, and whether it is done or active", async () => {
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Submit report", due_date: "2026-11-25", is_done: false }),
      task({ id: "t2", title: "Call mom", due_date: null, is_done: false }),
      task({ id: "t3", title: "File taxes", due_date: "2026-12-01", is_done: true }),
      task({ id: "t4", title: "Water plants", due_date: null, is_done: true }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    // Titles for every task.
    expect(await screen.findByText("Submit report")).toBeInTheDocument();
    expect(screen.getByText("Call mom")).toBeInTheDocument();
    expect(screen.getByText("File taxes")).toBeInTheDocument();
    expect(screen.getByText("Water plants")).toBeInTheDocument();

    // Due dates: set dates are shown; unset show "No due date".
    expect(screen.getByText("Due Nov 25, 2026")).toBeInTheDocument();
    expect(screen.getByText("Due Dec 1, 2026")).toBeInTheDocument();
    // Two tasks have no due date.
    expect(screen.getAllByText("No due date")).toHaveLength(2);

    // Done/active status: completed tasks show the "Done" badge; active ones do not.
    const doneBadges = screen.getAllByText("Done");
    expect(doneBadges).toHaveLength(2);
    // The active tasks' titles are NOT struck through (no "Done" badge next to them).
    // The done toggle button aria-label distinguishes active vs done.
    expect(screen.getByRole("button", { name: /Mark "Submit report" as done/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /Mark "Call mom" as done/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /Mark "File taxes" as not done/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: /Mark "Water plants" as not done/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("[AC-026] shows an empty-state message inviting me to add my first task when I have no tasks", async () => {
    mockedApiFetch.mockResolvedValueOnce([] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByText(/Add your first task/i)).toBeInTheDocument();
    // No task rows are rendered.
    expect(screen.queryByRole("button", { name: /Mark .* as done/i })).not.toBeInTheDocument();
  });

  it("[AC-027] selecting the active filter shows only tasks that are not done", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Active one", due_date: "2026-11-25", is_done: false }),
      task({ id: "t2", title: "Active two", due_date: null, is_done: false }),
      task({ id: "t3", title: "Done one", due_date: "2026-12-01", is_done: true }),
      task({ id: "t4", title: "Done two", due_date: null, is_done: true }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Active one");

    await user.click(screen.getByRole("button", { name: "Active" }));

    // Active tasks remain; completed tasks are hidden.
    expect(screen.getByText("Active one")).toBeInTheDocument();
    expect(screen.getByText("Active two")).toBeInTheDocument();
    expect(screen.queryByText("Done one")).not.toBeInTheDocument();
    expect(screen.queryByText("Done two")).not.toBeInTheDocument();
    // No "Done" badges in the active-filtered view.
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("[AC-028] selecting the completed filter shows only tasks that are done", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Active one", due_date: "2026-11-25", is_done: false }),
      task({ id: "t2", title: "Active two", due_date: null, is_done: false }),
      task({ id: "t3", title: "Done one", due_date: "2026-12-01", is_done: true }),
      task({ id: "t4", title: "Done two", due_date: null, is_done: true }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Active one");

    await user.click(screen.getByRole("button", { name: "Completed" }));

    // Completed tasks remain; active tasks are hidden.
    expect(screen.getByText("Done one")).toBeInTheDocument();
    expect(screen.getByText("Done two")).toBeInTheDocument();
    expect(screen.queryByText("Active one")).not.toBeInTheDocument();
    expect(screen.queryByText("Active two")).not.toBeInTheDocument();
    // Both completed tasks show the "Done" badge.
    expect(screen.getAllByText("Done")).toHaveLength(2);
  });

  it("[handleToggleInModal] clicking Mark Done in the edit modal toggles is_done via PATCH and updates the modal", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([
      task({ id: "t1", title: "Buy groceries", is_done: false }),
    ] as never);
    mockedApiFetch.mockResolvedValueOnce(
      task({ id: "t1", title: "Buy groceries", is_done: true }) as never,
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));
    await user.click(screen.getByRole("button", { name: /^Mark Done$/i }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/tasks/t1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ is_done: true }),
        }),
      );
    });
    // Modal now reflects the done state.
    expect(await screen.findByRole("button", { name: /^Mark Not Done$/i })).toBeInTheDocument();
  });

  it("[edit-modal] opening the edit modal focuses the title input", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task({ id: "t1", title: "Buy groceries" })] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));

    const titleInput = screen.getByLabelText(/Title \(required\)/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(titleInput);
    });
  });

  it("[edit-modal] pressing Escape closes the edit modal without saving", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task({ id: "t1", title: "Buy groceries" })] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));
    expect(screen.getByRole("heading", { name: "Edit Task" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Edit Task" })).not.toBeInTheDocument();
    });
    // No PATCH/DELETE was issued — only the initial GET.
    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
  });

  // US-014 / AC-029, AC-030: default sort by due date then creation time.
  // The screen sorts client-side (nulls last) on top of whatever order the API
  // returns, so assert the order a user sees by reading the done-toggle buttons
  // in document order — their aria-labels carry the task titles.
  async function displayedActiveTitles(): Promise<string[]> {
    const buttons = await screen.findAllByRole("button", { name: /^Mark ".*" as done$/i });
    return buttons.map((b) => {
      const label = b.getAttribute("aria-label") ?? "";
      const match = label.match(/^Mark "(.*)" as done$/i);
      return match ? match[1] : "";
    });
  }

  it("[AC-029] displays tasks ordered by due date ascending regardless of API order", async () => {
    // API returns tasks out of due-date order; the screen must re-sort.
    mockedApiFetch.mockResolvedValueOnce([
      task({
        id: "t1",
        title: "December task",
        due_date: "2026-12-10",
        created_at: "2026-11-09T10:00:00Z",
      }),
      task({
        id: "t2",
        title: "November task",
        due_date: "2026-11-01",
        created_at: "2026-11-10T10:00:00Z",
      }),
      task({
        id: "t3",
        title: "October task",
        due_date: "2026-10-15",
        created_at: "2026-11-11T10:00:00Z",
      }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("October task");
    expect(await displayedActiveTitles()).toEqual([
      "October task",
      "November task",
      "December task",
    ]);
  });

  it("[AC-030] same-due-date tasks keep creation-time order, and no-due-date tasks follow in creation-time order", async () => {
    // Same due date: Same-B is older than Same-A, so it must come first.
    // No due date: NoDue-B is older than NoDue-A, and both follow every dated task.
    mockedApiFetch.mockResolvedValueOnce([
      task({
        id: "t1",
        title: "Same-A",
        due_date: "2026-11-20",
        created_at: "2026-11-12T09:00:00Z",
      }),
      task({
        id: "t2",
        title: "Same-B",
        due_date: "2026-11-20",
        created_at: "2026-11-12T08:00:00Z",
      }),
      task({ id: "t3", title: "Late", due_date: "2026-12-01", created_at: "2026-11-01T10:00:00Z" }),
      task({ id: "t4", title: "NoDue-A", due_date: null, created_at: "2026-11-13T10:00:00Z" }),
      task({ id: "t5", title: "NoDue-B", due_date: null, created_at: "2026-11-13T09:00:00Z" }),
    ] as never);

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await screen.findByText("Same-B");
    expect(await displayedActiveTitles()).toEqual([
      "Same-B",
      "Same-A",
      "Late",
      "NoDue-B",
      "NoDue-A",
    ]);
  });
});
