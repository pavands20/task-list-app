import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import App from "./App";
import { clearSessionToken, setSessionToken } from "@/lib/api";

describe("App", () => {
  afterEach(() => {
    clearSessionToken();
  });

  it("renders a screen inside the app shell and shows its menu", () => {
    // /tasks is now behind an auth guard, so an authenticated session is
    // needed for the app shell (and its menu) to render.
    setSessionToken("test-token");
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>,
    );
    // getAllByText, not getByText: the page may repeat its menu item's text.
    expect(screen.getAllByText("My Tasks").length).toBeGreaterThan(0);
  });
});
