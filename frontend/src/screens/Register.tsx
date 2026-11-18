// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { apiFetch, setSessionToken, ApiError } from "@/lib/api";

const { Button, Input, Label } = UI;

export default function Screen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  const validateEmail = function (val) {
    if (!val.trim()) return "Email is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(val.trim())) return "Enter a valid email address.";
    return null;
  };

  const validatePassword = function (val) {
    if (!val) return "Password is required.";
    if (val.length < 8) return "Use at least 8 characters for your password.";
    return null;
  };

  const handleSubmit = async function (e) {
    if (e) e.preventDefault();
    if (submitting) return;
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const newErrors = {};
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setSessionToken(data.token);
      navigate("tasks");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors({ email: "Email is already registered" });
        } else if (
          err.status === 400 &&
          err.body &&
          typeof err.body === "object" &&
          err.body.detail &&
          typeof err.body.detail === "object"
        ) {
          const detail = err.body.detail;
          const ne = {};
          if (Array.isArray(detail.email) && detail.email.length) ne.email = detail.email[0];
          if (Array.isArray(detail.password) && detail.password.length)
            ne.password = detail.password[0];
          setErrors(ne);
        } else {
          setErrors({ email: "Could not create your account. Please try again." });
        }
      } else {
        setErrors({ email: "Could not create your account. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: brand.primaryColor,
    display: "block",
    marginBottom: "8px",
  };

  const getInputStyle = function (hasError) {
    return {
      width: "100%",
      border: "2px solid " + (hasError ? brand.accentColor : brand.primaryColor),
      borderRadius: brand.radius,
      backgroundColor: brand.backgroundColor,
      padding: "10px 12px",
      fontSize: "15px",
      fontFamily: brand.fontBody,
      color: brand.primaryColor,
      outline: "none",
      transition: "border-color 120ms ease",
    };
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "style",
      null,
      ".reg-input:focus-visible{outline:2px solid " +
        brand.accentColor +
        ";outline-offset:1px}" +
        ".reg-btn:focus-visible{outline:2px solid " +
        brand.accentColor +
        ";outline-offset:2px}" +
        ".reg-link:focus-visible{outline:2px solid " +
        brand.accentColor +
        ";outline-offset:2px}" +
        "@media (prefers-reduced-motion:reduce){" +
        ".reg-input,.reg-btn,.reg-link{transition:none!important}}" +
        ".reg-btn:hover:not(:disabled){opacity:0.88}" +
        ".reg-link:hover{color:" +
        brand.primaryColor +
        "}",
    ),
    React.createElement(
      "div",
      {
        style: {
          backgroundColor: brand.backgroundColor,
          fontFamily: brand.fontBody,
          minHeight: "100vh",
        },
        className: "flex flex-col items-center justify-center px-6 py-12",
      },
      React.createElement(
        "div",
        { className: "w-full", style: { maxWidth: "440px" } },
        // Brand wordmark
        React.createElement(
          "div",
          { className: "mb-12 flex items-center", style: { gap: "10px" } },
          React.createElement("span", {
            "aria-hidden": "true",
            style: {
              width: "10px",
              height: "10px",
              backgroundColor: brand.primaryColor,
              display: "inline-block",
            },
          }),
          React.createElement(
            "span",
            {
              style: {
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: brand.primaryColor,
              },
            },
            "Obsidian Tasks",
          ),
        ),
        // b-0-0: Title
        React.createElement(
          "div",
          { "data-wf": "b-0-0" },
          React.createElement("h1", {
            style: {
              fontFamily: brand.fontHeading,
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: brand.primaryColor,
              lineHeight: 1.15,
              margin: 0,
            },
            children: "Create Account",
          }),
        ),
        // b-1-0: Description
        React.createElement(
          "div",
          { "data-wf": "b-1-0", style: { marginTop: "12px" } },
          React.createElement("p", {
            style: {
              fontSize: "14px",
              lineHeight: 1.55,
              color: brand.neutralColor,
              margin: 0,
              maxWidth: "400px",
            },
            children:
              "Sign up with your email and a password. No email verification needed — you'll be signed in right away.",
          }),
        ),
        // Rule
        React.createElement("div", {
          "aria-hidden": "true",
          style: {
            height: "2px",
            backgroundColor: brand.primaryColor,
            marginTop: "32px",
          },
        }),
        // b-2-0: Form
        React.createElement(
          "form",
          {
            id: "reg-form",
            "data-wf": "b-2-0",
            onSubmit: handleSubmit,
            noValidate: true,
          },
          // Email field
          React.createElement(
            "div",
            { style: { padding: "20px 0" } },
            React.createElement(Label, { htmlFor: "reg-email", style: labelStyle }, "Email"),
            React.createElement(Input, {
              id: "reg-email",
              "data-wf": "i-2-0-0",
              type: "email",
              autoComplete: "email",
              className: "reg-input",
              value: email,
              onChange: function (e) {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors(function (prev) {
                    const n = Object.assign({}, prev);
                    delete n.email;
                    return n;
                  });
              },
              "aria-invalid": !!errors.email,
              "aria-describedby": errors.email ? "reg-email-error" : undefined,
              style: getInputStyle(!!errors.email),
            }),
            errors.email &&
              React.createElement(
                "div",
                {
                  id: "reg-email-error",
                  role: "alert",
                  style: {
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                    marginTop: "8px",
                    fontSize: "13px",
                    color: brand.accentColor,
                    lineHeight: 1.4,
                  },
                },
                React.createElement(Icons.AlertCircle, {
                  size: 14,
                  "aria-hidden": "true",
                  style: { flexShrink: 0, marginTop: "2px" },
                }),
                React.createElement("span", null, errors.email),
              ),
          ),
          // Hairline divider
          React.createElement("div", {
            "aria-hidden": "true",
            style: {
              height: "1px",
              backgroundColor: brand.primaryColor,
              opacity: 0.12,
            },
          }),
          // Password field
          React.createElement(
            "div",
            { style: { padding: "20px 0" } },
            React.createElement(Label, { htmlFor: "reg-password", style: labelStyle }, "Password"),
            React.createElement(Input, {
              id: "reg-password",
              "data-wf": "i-2-0-1",
              type: "password",
              autoComplete: "new-password",
              className: "reg-input",
              value: password,
              onChange: function (e) {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors(function (prev) {
                    const n = Object.assign({}, prev);
                    delete n.password;
                    return n;
                  });
              },
              "aria-invalid": !!errors.password,
              "aria-describedby": errors.password ? "reg-password-error" : "reg-password-hint",
              style: getInputStyle(!!errors.password),
            }),
            errors.password
              ? React.createElement(
                  "div",
                  {
                    id: "reg-password-error",
                    role: "alert",
                    style: {
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                      marginTop: "8px",
                      fontSize: "13px",
                      color: brand.accentColor,
                      lineHeight: 1.4,
                    },
                  },
                  React.createElement(Icons.AlertCircle, {
                    size: 14,
                    "aria-hidden": "true",
                    style: { flexShrink: 0, marginTop: "2px" },
                  }),
                  React.createElement("span", null, errors.password),
                )
              : React.createElement("p", {
                  id: "reg-password-hint",
                  style: {
                    margin: 0,
                    marginTop: "8px",
                    fontSize: "12px",
                    color: brand.neutralColor,
                    lineHeight: 1.4,
                  },
                  children: "Minimum 8 characters.",
                }),
          ),
        ),
        // Rule
        React.createElement("div", {
          "aria-hidden": "true",
          style: { height: "2px", backgroundColor: brand.primaryColor },
        }),
        // b-3-0: Button
        React.createElement(
          "div",
          { "data-wf": "b-3-0", style: { marginTop: "24px" } },
          React.createElement(
            "button",
            {
              type: "submit",
              form: "reg-form",
              disabled: submitting,
              className: "reg-btn",
              style: {
                width: "100%",
                backgroundColor: submitting ? brand.neutralColor : brand.primaryColor,
                color: brand.backgroundColor,
                border: "2px solid " + brand.primaryColor,
                borderRadius: brand.radius,
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: brand.fontBody,
                letterSpacing: "0.02em",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background-color 120ms ease, opacity 120ms ease",
              },
            },
            submitting ? "Creating account…" : "Create Account",
          ),
        ),
        // b-4-0: Link
        React.createElement(
          "div",
          { "data-wf": "b-4-0", style: { marginTop: "20px", textAlign: "center" } },
          React.createElement(
            "button",
            {
              type: "button",
              className: "reg-link",
              onClick: function () {
                navigate("sign-in");
              },
              style: {
                background: "none",
                border: "none",
                color: brand.neutralColor,
                fontSize: "14px",
                fontFamily: brand.fontBody,
                cursor: "pointer",
                padding: "4px 0",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                transition: "color 120ms ease",
              },
            },
            "Already have an account? Sign in",
          ),
        ),
      ),
    ),
  );
}
