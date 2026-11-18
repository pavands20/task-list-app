import { render, screen, fireEvent } from "@testing-library/react";
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

import { apiFetch } from "@/lib/api";
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
});
