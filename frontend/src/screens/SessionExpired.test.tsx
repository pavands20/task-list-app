import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Tasks from "@/screens/Tasks";
import { setSessionToken, getSessionToken } from "@/lib/api";

describe("Global 401 handling", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    // Any authenticated call returns 401 (expired/invalid session).
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
    // jsdom does not implement navigation; replace location with a plain
    // object so the redirect-to-sign-in seam is observable in a test.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("[AC-008] a 401 from an API call clears the session token and redirects to /sign-in", async () => {
    setSessionToken("expired-session-token");
    expect(getSessionToken()).toBe("expired-session-token");

    // Tasks calls GET /tasks on mount; with the token expired that returns 401.
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getSessionToken()).toBeNull();
    });
    expect(window.location.href).toBe("/sign-in");
  });
});
