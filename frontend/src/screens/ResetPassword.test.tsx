import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => null),
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

const mockedApiFetch = vi.mocked(apiFetch);

describe("ResetPassword screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[AC-011] reads the token from the URL, submits to the API, and redirects to /sign-in on success", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce({ message: "Your password has been reset." } as never);

    render(
      <MemoryRouter initialEntries={["/reset-password?token=abc-123"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("New password"), "newsecurepass");
    await user.type(screen.getByLabelText("Confirm new password"), "newsecurepass");
    await user.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/auth/password-reset/confirm",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "abc-123", new_password: "newsecurepass" }),
        }),
      );
    });

    // Shows the success state.
    expect(await screen.findByText("Password Updated")).toBeInTheDocument();

    // Redirects to /sign-in (after the success-state delay).
    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
      },
      { timeout: 2500 },
    );
  });

  it("[AC-011] shows validation errors for empty passwords and does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reset-password?token=abc-123"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(await screen.findByText("Password is required.")).toBeInTheDocument();
    expect(screen.getByText("Please confirm your new password.")).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("[AC-011] shows a validation error for mismatched passwords and does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reset-password?token=abc-123"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("New password"), "newsecurepass");
    await user.type(screen.getByLabelText("Confirm new password"), "differentpass");
    await user.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("[AC-011] shows an error message when the API returns 400 for an invalid/expired token", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(400, { detail: "Invalid or expired reset token." }, "confirm failed: 400"),
    );

    render(
      <MemoryRouter initialEntries={["/reset-password?token=bad-token"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("New password"), "newsecurepass");
    await user.type(screen.getByLabelText("Confirm new password"), "newsecurepass");
    await user.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(await screen.findByText("Invalid or expired reset token.")).toBeInTheDocument();
  });
});
