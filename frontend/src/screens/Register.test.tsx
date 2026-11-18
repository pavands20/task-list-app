import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

const tokenHolder = vi.hoisted(() => ({ current: null as string | null }));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  setSessionToken: vi.fn((t: string) => {
    tokenHolder.current = t;
  }),
  getSessionToken: vi.fn(() => tokenHolder.current),
  clearSessionToken: vi.fn(() => {
    tokenHolder.current = null;
  }),
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

import { apiFetch, setSessionToken, ApiError } from "@/lib/api";

const mockedApiFetch = vi.mocked(apiFetch);

describe("Register screen", () => {
  beforeEach(() => {
    tokenHolder.current = null;
    vi.clearAllMocks();
  });

  it("[AC-001] stores the token and redirects to /tasks on successful registration", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce({
      token: "tok-123",
      user: { id: "u1", email: "new@example.com" },
    } as never);
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Email/i), "new@example.com");
    await user.type(screen.getByLabelText(/Password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(setSessionToken).toHaveBeenCalledWith("tok-123");
    });
    expect(await screen.findByRole("heading", { name: "My Tasks" })).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("[AC-002] shows 'Email is already registered' on duplicate email", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(409, { detail: "Email is already registered" }, "register failed: 409"),
    );
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Email/i), "dup@example.com");
    await user.type(screen.getByLabelText(/Password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText("Email is already registered")).toBeInTheDocument();
    });
  });

  it("[AC-003] shows field-level validation errors for invalid email and empty password", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
