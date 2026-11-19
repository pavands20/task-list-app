import { render, screen } from "@testing-library/react";
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

describe("Tasks screen load-error path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApiFetch.mockReset();
  });

  it("[AC-026] a failed GET /tasks on mount leaves the list empty and shows the empty state without crashing", async () => {
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(500, { detail: "Server error" }, "GET failed: 500"),
    );

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    // The load failure is swallowed and the empty state guides the user.
    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByText(/Add your first task/i)).toBeInTheDocument();
    // No task rows are rendered.
    expect(screen.queryByRole("button", { name: /Mark .* as done/i })).not.toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    expect(mockedApiFetch).toHaveBeenCalledWith("/tasks");
  });
});
