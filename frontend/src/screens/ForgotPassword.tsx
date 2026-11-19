// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { apiFetch } from "@/lib/api";

const { Input, Label } = UI;

export default function Screen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email address is required.");
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setError("Enter a valid email address, such as name@domain.com.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
      });
      setConfirmation(
        (data && data.message) ||
          "If an account exists for this email, a password reset link has been sent.",
      );
      setSubmitted(true);
    } catch {
      setError("Could not send the reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const pageStyle = {
    backgroundColor: brand.backgroundColor,
    color: brand.primaryColor,
    fontFamily: brand.fontBody,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "48px 24px",
  };

  const containerStyle = {
    width: "100%",
    maxWidth: "460px",
    margin: "0 auto",
  };

  const ruleStyle = {
    height: "2px",
    backgroundColor: brand.primaryColor,
    border: "none",
    width: "100%",
  };

  const labelStyle = {
    fontFamily: brand.fontBody,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: brand.primaryColor,
    marginBottom: "8px",
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "2px solid " + brand.primaryColor,
    borderRadius: brand.radius,
    backgroundColor: brand.backgroundColor,
    color: brand.primaryColor,
    fontFamily: brand.fontBody,
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  const primaryButtonStyle = {
    width: "100%",
    padding: "13px 16px",
    border: "2px solid " + brand.primaryColor,
    borderRadius: brand.radius,
    backgroundColor: brand.primaryColor,
    color: brand.backgroundColor,
    fontFamily: brand.fontBody,
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "background-color 0.15s ease, opacity 0.15s ease",
  };

  const linkButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 0",
    border: "none",
    background: "none",
    color: brand.primaryColor,
    fontFamily: brand.fontBody,
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "color 0.15s ease",
  };

  const confirmationTextStyle = {
    fontSize: "13px",
    lineHeight: "1.6",
    color: brand.neutralColor,
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Row 1: Page title */}
        <div data-wf="b-0-0" style={{ marginBottom: "16px" }}>
          <h1
            style={{
              fontFamily: brand.fontHeading,
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              margin: "0",
              color: brand.primaryColor,
            }}
          >
            Forgot Password
          </h1>
        </div>

        <hr style={Object.assign({}, ruleStyle, { marginBottom: "24px" })} />

        {/* Row 2: Description text */}
        <div data-wf="b-1-0" style={{ marginBottom: "28px" }}>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: brand.neutralColor,
              margin: "0",
            }}
          >
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          /* Row 5: Confirmation message (after submit) */
          <div data-wf="b-4-0" style={{ marginBottom: "28px" }}>
            <div
              style={{
                border: "2px solid " + brand.primaryColor,
                borderRadius: brand.radius,
                padding: "20px",
                backgroundColor: brand.backgroundColor,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <Icons.CheckCircle
                  aria-hidden="true"
                  style={{
                    flexShrink: "0",
                    width: "18px",
                    height: "18px",
                    marginTop: "1px",
                    color: brand.primaryColor,
                  }}
                />
                <p style={Object.assign({}, confirmationTextStyle, { margin: "0" })}>
                  {confirmation ||
                    "If an account exists for this email, a password reset link has been sent."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ marginBottom: "28px" }}>
            {/* Row 3: Form with email field */}
            <div data-wf="b-2-0" style={{ marginBottom: "24px" }}>
              <Label htmlFor="email" style={labelStyle}>
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                data-wf="i-2-0-0"
                value={email}
                onChange={function (e) {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="name@domain.com"
                autoComplete="email"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "email-error" : undefined}
                style={Object.assign({}, inputStyle, {
                  borderColor: error ? brand.accentColor : brand.primaryColor,
                })}
                onFocus={function (e) {
                  e.target.style.boxShadow =
                    "0 0 0 2px " + brand.backgroundColor + ", 0 0 0 4px " + brand.accentColor;
                }}
                onBlur={function (e) {
                  e.target.style.boxShadow = "none";
                }}
              />
              {error && (
                <div
                  id="email-error"
                  role="alert"
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: brand.accentColor,
                  }}
                >
                  <Icons.AlertCircle
                    aria-hidden="true"
                    style={{
                      flexShrink: "0",
                      width: "14px",
                      height: "14px",
                      marginTop: "2px",
                    }}
                  />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Row 4: Submit button */}
            <div data-wf="b-3-0">
              <button
                type="submit"
                disabled={loading}
                style={Object.assign({}, primaryButtonStyle, {
                  opacity: loading ? "0.6" : "1",
                  cursor: loading ? "default" : "pointer",
                })}
                onFocus={function (e) {
                  e.target.style.boxShadow =
                    "0 0 0 2px " + brand.backgroundColor + ", 0 0 0 4px " + brand.accentColor;
                }}
                onBlur={function (e) {
                  e.target.style.boxShadow = "none";
                }}
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid " + brand.backgroundColor,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Sending link…
                  </>
                ) : (
                  <>
                    <Icons.FileText aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                    Send Reset Link
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <hr style={Object.assign({}, ruleStyle, { marginBottom: "20px", opacity: "0.15" })} />

        {/* Row 6: Navigation links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div data-wf="b-5-0" style={{ flex: "1 1 0", minWidth: "180px" }}>
            <button
              type="button"
              onClick={function () {
                navigate("reset-password");
              }}
              style={linkButtonStyle}
              onFocus={function (e) {
                e.target.style.color = brand.accentColor;
              }}
              onBlur={function (e) {
                e.target.style.color = brand.primaryColor;
              }}
            >
              Follow reset link from email
              <Icons.ChevronRight aria-hidden="true" style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
          <div data-wf="b-5-1" style={{ flex: "1 1 0", minWidth: "180px" }}>
            <button
              type="button"
              onClick={function () {
                navigate("sign-in");
              }}
              style={Object.assign({}, linkButtonStyle, { justifyContent: "flex-end" })}
              onFocus={function (e) {
                e.target.style.color = brand.accentColor;
              }}
              onBlur={function (e) {
                e.target.style.color = brand.primaryColor;
              }}
            >
              <Icons.ArrowLeft aria-hidden="true" style={{ width: "14px", height: "14px" }} />
              Back to sign in
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        *:focus-visible {
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );
}
