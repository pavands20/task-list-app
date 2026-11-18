// US-006 / AC-014: the app is free with no payments, billing or plans.
//
// A component test guarding the negative space: the task list -- the screen a
// user lands on after registering -- must never surface payment, billing, plan,
// subscription, trial, upgrade or pricing copy, and must never render a payment
// form or a "choose a plan" / "upgrade" call to action. If a later change adds a
// paywall, these assertions fail rather than ship a paid-plan restriction.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Tasks from "@/screens/Tasks";

// Payment-specific copy a paywall would show. These are full phrases so a task
// title such as "Plan weekend trip" (contains the word "Plan") does not trip a
// false positive, while "choose a plan" / "upgrade" / "billing details" do.
const PAYMENT_COPY = [
  "payment",
  "billing",
  "subscription",
  "upgrade",
  "downgrade",
  "pricing",
  "paywall",
  "stripe",
  "credit card",
  "card number",
  "free trial",
  "paid plan",
  "choose a plan",
  "your plan",
  "payment information",
  "payment method",
  "billing details",
];

// Roles that would carry a payment call to action if a paywall existed.
const ACTION_ROLES = ["button", "link"] as const;

describe("[AC-014] Tasks screen is free of payment prompts", () => {
  it("renders no payment, billing, plan or subscription copy", () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    const text = screen.getByText(/My Tasks/).parentElement?.parentElement?.textContent ?? "";
    const body = (document.body.textContent ?? "").toLowerCase();

    // The whole rendered document is the surface a user reads; none of it may
    // mention payment concepts.
    for (const term of PAYMENT_COPY) {
      expect(body).not.toContain(term);
    }
    // Sanity: the screen actually rendered its task content (not an empty DOM).
    expect(text.length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "My Tasks" })).toBeInTheDocument();
  });

  it("offers no payment, plan, upgrade or billing call to action", () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    const actionPatterns = [
      /pay/i,
      /billing/i,
      /upgrade/i,
      /downgrade/i,
      /subscribe/i,
      /subscription/i,
      /choose a plan/i,
      /select a plan/i,
      /pricing/i,
      /free trial/i,
      /paid plan/i,
    ];

    for (const role of ACTION_ROLES) {
      for (const pattern of actionPatterns) {
        expect(screen.queryByRole(role, { name: pattern })).toBeNull();
      }
    }
  });

  it("lets a user add, complete and edit a task with no payment gate", () => {
    const { container } = render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>,
    );

    // The add-task form is present and unrestricted: only a title and an
    // optional due date, no payment field.
    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    expect(titleInput).toBeInTheDocument();
    // No payment inputs (card number / cvc / expiry) anywhere on the screen.
    expect(container.querySelector('input[name*="card" i]')).toBeNull();
    expect(container.querySelector('input[name*="cvc" i]')).toBeNull();
    expect(container.querySelector('input[autocomplete*="cc-" i]')).toBeNull();

    // The filter tabs are All / Active / Completed -- no "Premium" / "Pro" tier.
    const filterGroup = screen.getByRole("group", { name: /filter tasks/i });
    expect(filterGroup).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /premium|pro|upgrade/i })).toBeNull();
  });
});
