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

import { apiFetch } from "@/lib/api";

const mockedApiFetch = vi.mocked(apiFetch);

const NEUTRAL_MESSAGE = "If an account exists for this email, a password reset link has been sent.";

describe("ForgotPassword screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[AC-009] submits the email to POST /auth/password-reset/request and shows the neutral confirmation from the response", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce({ message: NEUTRAL_MESSAGE } as never);

    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Email address/i), "someone@example.com");
    await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/auth/password-reset/request",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "someone@example.com" }),
        }),
      );
    });
    expect(await screen.findByText(NEUTRAL_MESSAGE)).toBeInTheDocument();
  });

  it("[AC-009] shows a validation error for an empty email and does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    expect(await screen.findByText("Email address is required.")).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("[AC-009] shows a validation error for an invalid email and does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Email address/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    expect(
      await screen.findByText("Enter a valid email address, such as name@domain.com."),
    ).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
