import { render, screen } from "@testing-library/react";
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

describe("Auth guard", () => {
  beforeEach(() => {
    tokenHolder.current = null;
    vi.clearAllMocks();
  });

  it("[auth guard] redirects unauthenticated users from /tasks to /sign-in", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("[auth guard] redirects unauthenticated users from /account to /sign-in", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });
});
