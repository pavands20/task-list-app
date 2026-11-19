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

import { apiFetch, clearSessionToken, ApiError } from "@/lib/api";

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

  it("[AC-012] typing DELETE and confirming calls DELETE /account via apiFetch, clears the session token, and navigates to /sign-in on success", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce(undefined as never); // DELETE /account -> 204

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );

    // Open the confirm-delete modal.
    await user.click(screen.getByRole("button", { name: "Delete My Account" }));

    // Type DELETE to arm the confirm button.
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), "DELETE");

    // Confirm account deletion.
    await user.click(screen.getByRole("button", { name: /Yes, Delete My Account/i }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/account", { method: "DELETE" });
    });

    await waitFor(() => expect(mockedClear).toHaveBeenCalled());
    expect(await screen.findByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("[AC-012] the delete button shows a loading state ('Deleting…') while the API call is in flight", async () => {
    const user = userEvent.setup();
    let resolveDelete!: (value: unknown) => void;
    mockedApiFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
    );

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Delete My Account" }));
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), "DELETE");
    await user.click(screen.getByRole("button", { name: /Yes, Delete My Account/i }));

    // The confirm button shows the loading state while the call is pending.
    expect(await screen.findByText("Deleting…")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith("/account", { method: "DELETE" });

    // Let the in-flight call resolve so the test tears down cleanly.
    resolveDelete(undefined);
    await waitFor(() => expect(mockedClear).toHaveBeenCalled());
  });

  it("[AC-012] shows an error message and stays on the account settings screen when DELETE /account fails", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockRejectedValueOnce(
      new ApiError(401, { detail: "Unauthorized" }, "DELETE /account failed: 401"),
    );

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Delete My Account" }));
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), "DELETE");
    await user.click(screen.getByRole("button", { name: /Yes, Delete My Account/i }));

    // An error message is shown for the failed deletion.
    expect(await screen.findByText(/Could not delete your account/i)).toBeInTheDocument();

    // The session token is NOT cleared and the user stays on the account screen.
    expect(mockedClear).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Account Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sign In" })).not.toBeInTheDocument();
  });
});
