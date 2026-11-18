// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.

import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { apiFetch, setSessionToken } from "@/lib/api";

const { Input, Label } = UI;

const { AlertCircle } = Icons;

export default function Screen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setEmailError("");
    setPasswordError("");

    let valid = true;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      setSessionToken(data.token);
      navigate("tasks");
    } catch {
      // Generic message that does not reveal whether the email exists (NFR-004).
      setAuthError("The email or password you entered is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: brand.neutralColor,
    marginBottom: "6px",
    display: "block",
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    border: `2px solid ${hasError ? brand.accentColor : brand.primaryColor}`,
    borderRadius: `${brand.radius}px`,
    padding: "11px 12px",
    fontSize: "14px",
    fontFamily: brand.fontBody,
    color: brand.primaryColor,
    backgroundColor: brand.backgroundColor,
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  });

  return (
    <div
      style={{
        backgroundColor: brand.backgroundColor,
        minHeight: "100vh",
        fontFamily: brand.fontBody,
        color: brand.primaryColor,
      }}
      className="flex flex-col"
    >
      <style>{`
        .si-input:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px ${brand.backgroundColor}, 0 0 0 4px ${brand.primaryColor};
        }
        .si-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px ${brand.backgroundColor}, 0 0 0 4px ${brand.primaryColor};
        }
        .si-link:focus-visible {
          outline: 2px solid ${brand.primaryColor};
          outline-offset: 3px;
        }
        .si-btn:hover:not(:disabled) {
          opacity: 0.88;
        }
        .si-link:hover {
          text-decoration-thickness: 2px;
        }
        @keyframes si-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .si-error-enter {
          animation: si-fade 0.18s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .si-input, .si-btn, .si-link { transition: none !important; }
          .si-error-enter { animation: none; }
          .si-btn:hover:not(:disabled) { opacity: 1; }
        }
      `}</style>

      {/* Top rule — signature 2px obsidian bar */}
      <div
        style={{ height: "2px", backgroundColor: brand.primaryColor, width: "100%", flexShrink: 0 }}
        aria-hidden
      />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Product identifier */}
          <div
            aria-hidden
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: brand.neutralColor,
              marginBottom: "10px",
            }}
          >
            Obsidian Tasks
          </div>

          {/* Page title */}
          <div data-wf="b-0-0">
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: brand.primaryColor,
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Sign In
            </h1>
          </div>

          {/* 2px rule under heading */}
          <div
            aria-hidden
            style={{
              height: "2px",
              backgroundColor: brand.primaryColor,
              marginTop: "14px",
              marginBottom: "24px",
            }}
          />

          {/* Auth error — generic, does not reveal which field is wrong */}
          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              className="si-error-enter"
              style={{
                border: `2px solid ${brand.accentColor}`,
                borderRadius: `${brand.radius}px`,
                padding: "10px 12px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <AlertCircle
                size={16}
                style={{ color: brand.accentColor, flexShrink: 0, marginTop: "1px" }}
                aria-hidden
              />
              <span style={{ fontSize: "13px", color: brand.accentColor, lineHeight: 1.5 }}>
                {authError}
              </span>
            </div>
          )}

          {/* Form */}
          <form data-wf="b-1-0" onSubmit={handleSubmit} noValidate>
            {/* Email field */}
            <div style={{ marginBottom: "20px" }}>
              <Label htmlFor="signin-email" style={labelStyle}>
                Email
              </Label>
              <Input
                id="signin-email"
                type="email"
                data-wf="i-1-0-0"
                className="si-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (authError) setAuthError("");
                }}
                style={inputStyle(!!emailError)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "signin-email-error" : undefined}
                autoComplete="email"
              />
              {emailError && (
                <p
                  id="signin-email-error"
                  className="si-error-enter"
                  style={{
                    fontSize: "12px",
                    color: brand.accentColor,
                    marginTop: "6px",
                    lineHeight: 1.4,
                  }}
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "24px" }}>
              <Label htmlFor="signin-password" style={labelStyle}>
                Password
              </Label>
              <Input
                id="signin-password"
                type="password"
                data-wf="i-1-0-1"
                className="si-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                  if (authError) setAuthError("");
                }}
                style={inputStyle(!!passwordError)}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "signin-password-error" : undefined}
                autoComplete="current-password"
              />
              {passwordError && (
                <p
                  id="signin-password-error"
                  className="si-error-enter"
                  style={{
                    fontSize: "12px",
                    color: brand.accentColor,
                    marginTop: "6px",
                    lineHeight: 1.4,
                  }}
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              data-wf="b-2-0"
              disabled={loading}
              className="si-btn"
              style={{
                width: "100%",
                backgroundColor: loading ? brand.neutralColor : brand.primaryColor,
                color: brand.backgroundColor,
                border: `2px solid ${brand.primaryColor}`,
                borderRadius: `${brand.radius}px`,
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: brand.fontBody,
                cursor: loading ? "not-allowed" : "pointer",
                transition:
                  "background-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Links row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(92, 92, 92, 0.18)",
            }}
          >
            <button
              type="button"
              data-wf="b-3-0"
              className="si-link"
              onClick={() => navigate("register")}
              style={{
                background: "none",
                border: "none",
                padding: "4px 0",
                fontSize: "13px",
                color: brand.primaryColor,
                fontFamily: brand.fontBody,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationThickness: "1px",
              }}
            >
              Create an account
            </button>
            <button
              type="button"
              data-wf="b-3-1"
              className="si-link"
              onClick={() => navigate("forgot-password")}
              style={{
                background: "none",
                border: "none",
                padding: "4px 0",
                fontSize: "13px",
                color: brand.neutralColor,
                fontFamily: brand.fontBody,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationThickness: "1px",
              }}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
