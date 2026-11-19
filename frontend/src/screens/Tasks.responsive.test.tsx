// US-015-1 / NFR-008: the task list screen must stay usable and readable
// without horizontal scrolling from small mobile through large desktop.
//
// jsdom has no real viewport, so these tests assert the responsive *structure*
// the CSS reflows against: the width-capped container, the responsive table
// class, the card-layout cell classes, and the vertically-stacking form / filter
// / modal-action rows. The actual reflow is a media-query concern verified by
// the e2e suite on real viewports.
import { render, screen } from "@testing-library/react";
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
import App from "@/App";
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

describe("Tasks responsive layout (NFR-008)", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetch.mockResolvedValue([] as never);
  });

  it("[NFR-008] the screen content is centered and width-capped so it stays readable on large desktops without horizontal scroll", () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    // A max-width container keeps the list from stretching edge-to-edge at 1920px.
    expect(document.querySelector(".max-w-5xl")).not.toBeNull();
    // Horizontal padding keeps content off the viewport edge on small screens.
    expect(document.querySelector(".px-4")).not.toBeNull();
  });

  it("[NFR-008] the task table carries a responsive class so it can reflow into a stacked card layout on small screens", async () => {
    mockedApiFetch.mockResolvedValueOnce([task()] as never);
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    await screen.findByText("Buy groceries");
    const table = screen.getByRole("table");
    expect(table.className).toContain("tasks-table");
  });

  it("[NFR-008] each task row uses card-layout cell classes so the row reflows without horizontal scroll", async () => {
    mockedApiFetch.mockResolvedValueOnce([task()] as never);
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    await screen.findByText("Buy groceries");
    const row = screen.getByRole("button", { name: /Edit "Buy groceries"/i }).closest("tr");
    expect(row).not.toBeNull();
    const cells = row!.querySelectorAll("td");
    expect(cells).toHaveLength(4);
    expect(cells[0].className).toContain("cell-check");
    expect(cells[1].className).toContain("cell-title");
    expect(cells[2].className).toContain("cell-due");
    expect(cells[3].className).toContain("cell-edit");
  });

  it("[NFR-008] the add-task form stacks vertically on small screens so it stays usable without horizontal scroll", () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    const formRow = titleInput.closest(".flex.flex-col");
    expect(formRow).not.toBeNull();
  });

  it("[NFR-008] the filter tabs and sort label stack vertically on small screens", () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    const filterGroup = screen.getByRole("group", { name: /filter tasks/i });
    const row = filterGroup.closest(".flex.flex-col");
    expect(row).not.toBeNull();
  });

  it("[NFR-008] the edit modal is width-capped, full-width and padded so it fits the mobile viewport", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task()] as never);
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("w-full");
    expect(dialog.className).toContain("max-w-lg");
  });

  it("[NFR-008] the edit modal action buttons stack vertically on small screens", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce([task()] as never);
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    await screen.findByText("Buy groceries");
    await user.click(screen.getByRole("button", { name: /Edit "Buy groceries"/i }));
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    const actions = saveBtn.closest(".flex.flex-col");
    expect(actions).not.toBeNull();
  });

  it("[NFR-008] the empty state renders inside the responsive width-capped container", async () => {
    mockedApiFetch.mockResolvedValueOnce([] as never);
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );
    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
    expect(document.querySelector(".max-w-5xl")).not.toBeNull();
  });

  it("[NFR-008] the app header nav wraps so it adapts on small screens without horizontal scroll", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "App menu" });
    expect(nav.className).toContain("flex-wrap");
  });
});
