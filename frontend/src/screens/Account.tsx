// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { apiFetch, clearSessionToken } from "@/lib/api";

const { Button, Input, Label } = UI;

const { Settings } = Icons;

export default function Screen() {
  const navigate = useNavigate();
  // ── State ──────────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [error, setError] = React.useState(null);

  // ── Derived ────────────────────────────────────────────────────
  const email = "jane@example.com";
  const canConfirmDelete = confirmText.trim().toLowerCase() === "delete";

  // ── Handlers ───────────────────────────────────────────────────
  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // If the server already rejected the token, the global 401 handler or
      // the finally below still ends the local session.
    } finally {
      clearSessionToken();
      navigate("sign-in");
    }
  }

  async function handleDelete() {
    if (!canConfirmDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await apiFetch("/account", { method: "DELETE" });
      clearSessionToken();
      navigate("sign-in");
    } catch (err) {
      setError("Could not delete your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function closeModal() {
    setDeleteModalOpen(false);
    setConfirmText("");
    setError(null);
  }

  // ── Styles ─────────────────────────────────────────────────────
  const headingStyle = {
    fontFamily: brand.fontHeading,
    color: brand.primaryColor,
    letterSpacing: "-0.02em",
  };

  const labelStyle = {
    fontFamily: brand.fontBody,
    color: brand.neutralColor,
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  const border2 = {
    border: "2px solid " + brand.primaryColor,
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640 }} className="mx-auto w-full px-6 py-10">
      {/* ── Row 1: Page title ─────────────────────────────────── */}
      <div data-wf="b-0-0">
        <h1 style={headingStyle} className="text-[32px] font-bold leading-none">
          Account Settings
        </h1>
        <div className="mt-4" style={{ height: "2px", backgroundColor: brand.primaryColor }} />
      </div>

      {/* ── Row 2: Signed-in identity ─────────────────────────── */}
      <div data-wf="b-1-0" className="mt-8">
        <span style={labelStyle}>Session</span>
        <div className="mt-3 flex items-center gap-2.5">
          <Icons.User
            aria-hidden="true"
            style={{ width: 16, height: 16, color: brand.primaryColor }}
          />
          <span
            style={{
              fontFamily: brand.fontBody,
              color: brand.primaryColor,
              fontSize: "15px",
            }}
          >
            Signed in as <strong style={{ fontWeight: 600 }}>{email}</strong>
          </span>
        </div>
      </div>

      {/* ── Row 3: Sign Out ───────────────────────────────────── */}
      <div data-wf="b-2-0" className="mt-6">
        <Button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full justify-center"
          style={{
            fontFamily: brand.fontBody,
            fontSize: "14px",
            fontWeight: 600,
            color: brand.backgroundColor,
            backgroundColor: brand.primaryColor,
            borderRadius: brand.radius,
            border: "2px solid " + brand.primaryColor,
            padding: "10px 20px",
            height: "44px",
          }}
        >
          {signingOut ? "Signing out…" : "Sign Out"}
        </Button>
      </div>

      {/* ── Row 4: Danger zone text ───────────────────────────── */}
      <div
        data-wf="b-3-0"
        className="mt-12"
        style={{ height: "2px", backgroundColor: brand.primaryColor }}
      />
      <div data-wf="b-3-0" className="mt-6">
        <span style={labelStyle}>Danger Zone</span>
        <p
          className="mt-3"
          style={{
            fontFamily: brand.fontBody,
            color: brand.primaryColor,
            fontSize: "15px",
            lineHeight: 1.5,
          }}
        >
          Permanently delete your account and all your tasks. This action cannot be undone.
        </p>
      </div>

      {/* ── Row 5: Confirm Account Deletion modal trigger ─────── */}
      <div data-wf="b-4-0" className="mt-5">
        <Button
          onClick={() => {
            setError(null);
            setConfirmText("");
            setDeleteModalOpen(true);
          }}
          disabled={signingOut}
          className="w-full justify-center"
          style={{
            fontFamily: brand.fontBody,
            fontSize: "14px",
            fontWeight: 600,
            color: brand.backgroundColor,
            backgroundColor: brand.accentColor,
            borderRadius: brand.radius,
            border: "2px solid " + brand.accentColor,
            padding: "10px 20px",
            height: "44px",
          }}
        >
          Delete My Account
        </Button>
      </div>

      {/* ── Modal ─────────────────────────────────────────────── */}
      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(17,17,17,0.35)" }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
          }}
          tabIndex={-1}
        >
          <div
            className="w-full max-w-md"
            style={{
              backgroundColor: brand.backgroundColor,
              border: "2px solid " + brand.primaryColor,
              borderRadius: brand.radius,
            }}
          >
            {/* Modal header */}
            <div className="px-5 py-4" style={{ borderBottom: "2px solid " + brand.primaryColor }}>
              <h2
                id="delete-modal-title"
                style={headingStyle}
                className="text-[18px] font-semibold leading-none"
              >
                Confirm Account Deletion
              </h2>
            </div>

            {/* Modal body */}
            <div className="px-5 py-5">
              <div data-wf="i-4-0-0" className="flex items-start gap-2.5">
                <Icons.AlertCircle
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    color: brand.accentColor,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />
                <p
                  style={{
                    fontFamily: brand.fontBody,
                    color: brand.primaryColor,
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  Are you sure? Your account and all tasks will be permanently removed. Sessions
                  will be ended immediately and you will not be able to sign in again.
                </p>
              </div>

              <div className="mt-5">
                <Label htmlFor="confirm-delete" style={labelStyle}>
                  Type DELETE to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  data-wf="i-4-0-0"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  autoComplete="off"
                  placeholder=""
                  className="mt-2 w-full"
                  style={{
                    fontFamily: brand.fontBody,
                    fontSize: "14px",
                    color: brand.primaryColor,
                    border: "2px solid " + brand.primaryColor,
                    borderRadius: brand.radius,
                    padding: "8px 12px",
                    height: "40px",
                    backgroundColor: brand.backgroundColor,
                  }}
                />
              </div>

              {error && (
                <p
                  className="mt-3"
                  style={{
                    fontFamily: brand.fontBody,
                    fontSize: "13px",
                    color: brand.accentColor,
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            {/* Modal footer — Row 6 */}
            <div className="flex" style={{ borderTop: "2px solid " + brand.primaryColor }}>
              <div data-wf="b-5-0" className="flex-[8_8_0%]">
                <button
                  data-wf="b-5-0"
                  onClick={handleDelete}
                  disabled={!canConfirmDelete || deleting}
                  className="w-full justify-center flex items-center gap-2"
                  style={{
                    fontFamily: brand.fontBody,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: brand.backgroundColor,
                    backgroundColor: canConfirmDelete && !deleting ? brand.accentColor : "#d4a38a",
                    border: "none",
                    borderRight: "2px solid " + brand.primaryColor,
                    borderRadius: 0,
                    padding: "12px 16px",
                    height: "48px",
                    cursor: canConfirmDelete && !deleting ? "pointer" : "not-allowed",
                  }}
                >
                  <Icons.X aria-hidden="true" style={{ width: 14, height: 14 }} />
                  {deleting ? "Deleting…" : "Yes, Delete My Account"}
                </button>
              </div>
              <div data-wf="b-5-1" className="flex-[4_4_0%]">
                <button
                  data-wf="b-5-1"
                  onClick={closeModal}
                  disabled={deleting}
                  className="w-full justify-center flex items-center"
                  style={{
                    fontFamily: brand.fontBody,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: brand.primaryColor,
                    backgroundColor: brand.backgroundColor,
                    border: "none",
                    borderRadius: 0,
                    padding: "12px 16px",
                    height: "48px",
                    cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
