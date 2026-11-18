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

describe("SignIn screen", () => {
  beforeEach(() => {
    tokenHolder.current = null;
    vi.clearAllMocks();
  });

  it("[AC-004] stores the token and redirects to /tasks on successful sign-in", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce({
      token: "tok-signin",
      user: { id: "u1", email: "a@b.com" },
    } as never);
    render(
      <MemoryRouter initialEntries={["/sign-in"]}>
        <App />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Email/i), "a@b.com");
    await user.type(screen.getByLabelText(/Password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(setSessionToken).toHaveBeenCalledWith("tok-signin");
    });
    expect(await screen.findByRole("heading", { name: "My Tasks" })).toBeInTheDocument();
  });

  it("[AC-005] shows a generic error on failed sign-in that does not reveal whether the email exists", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(401, { detail: "Invalid email or password" }, "login failed: 401"),
    );
    render(
      <MemoryRouter initialEntries={["/sign-in"]}>
        <App />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Email/i), "unknown@example.com");
    await user.type(screen.getByLabelText(/Password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(
      await screen.findByText("The email or password you entered is incorrect."),
    ).toBeInTheDocument();
  });

  it("[AC-006] shows only email and password fields with no SSO or third-party auth options", () => {
    render(
      <MemoryRouter initialEntries={["/sign-in"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.queryByText(/sign in with|google|sso|github|microsoft/i)).not.toBeInTheDocument();
  });
});
