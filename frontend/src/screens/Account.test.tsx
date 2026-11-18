import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => "session-token"),
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

import { apiFetch, clearSessionToken } from "@/lib/api";

const mockedApiFetch = vi.mocked(apiFetch);
const mockedClear = vi.mocked(clearSessionToken);

describe("Account screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[AC-007] Sign Out calls POST /auth/logout, shows a loading state, clears the token and navigates to /sign-in", async () => {
    const user = userEvent.setup();
    let resolveLogout!: (value: unknown) => void;
    mockedApiFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogout = resolve;
      }),
    );

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Sign Out" }));

    // The button shows a loading state while the logout call is in flight.
    expect(await screen.findByText("Signing out…")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/logout", { method: "POST" });

    resolveLogout(undefined);

    await waitFor(() => expect(mockedClear).toHaveBeenCalled());
    expect(await screen.findByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });
});
