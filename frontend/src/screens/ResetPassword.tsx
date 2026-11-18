// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.

import React from "react";

import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

export default function Screen() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const pageStyle = {
    backgroundColor: brand.backgroundColor,
    fontFamily: brand.fontBody,
    color: brand.primaryColor,
    minHeight: "100vh",
  };

  const borderStyle = "2px solid " + brand.primaryColor;

  function validate() {
    const e = {};
    if (!newPassword) {
      e.newPassword = "Password is required.";
    } else if (newPassword.length < 8) {
      e.newPassword = "Use at least 8 characters.";
    }
    if (!confirmPassword) {
      e.confirmPassword = "Please confirm your new password.";
    } else if (newPassword && confirmPassword !== newPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    // Simulate API call to POST /auth/password-reset/confirm
    setTimeout(function () {
      setSubmitting(false);
      setDone(true);
      setTimeout(function () {
        navigate("sign-in");
      }, 1600);
    }, 700);
  }

  const labelClass = "block uppercase mb-1.5";
  const labelStyle = {
    fontSize: "11px",
    letterSpacing: "0.08em",
    fontWeight: 600,
    color: brand.primaryColor,
    lineHeight: 1,
  };

  const inputClass = "w-full px-3 py-2.5 outline-none focus:outline-none";
  const inputStyleBase = {
    border: borderStyle,
    borderRadius: brand.radius,
    fontSize: "14px",
    fontFamily: brand.fontBody,
    color: brand.primaryColor,
    backgroundColor: brand.backgroundColor,
  };

  function getInputStyle(hasError) {
    return Object.assign({}, inputStyleBase, {
      borderColor: hasError ? brand.accentColor : brand.primaryColor,
    });
  }

  if (done) {
    return React.createElement(
      "div",
      {
        style: pageStyle,
        className: "flex items-center justify-center px-6 py-16 min-h-screen",
        "data-wf": "b-0-0",
      },
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            maxWidth: "400px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              borderTop: borderStyle,
              borderLeft: borderStyle,
              borderRight: borderStyle,
              borderBottom: borderStyle,
              borderRadius: brand.radius,
              padding: "40px 32px",
            },
          },
          React.createElement(Icons.CheckCircle, {
            size: 28,
            style: { color: brand.primaryColor, marginBottom: "16px" },
            "aria-hidden": true,
          }),
          React.createElement(
            "h1",
            {
              style: {
                fontFamily: brand.fontHeading,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                margin: "0 0 8px 0",
                lineHeight: 1.2,
              },
            },
            "Password Updated",
          ),
          React.createElement(
            "p",
            {
              style: {
                fontSize: "14px",
                color: brand.neutralColor,
                lineHeight: 1.5,
                margin: "0 0 16px 0",
              },
            },
            "Your password has been changed and all previous sessions have been ended. You will be redirected to sign in.",
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "12px",
                color: brand.neutralColor,
                letterSpacing: "0.04em",
              },
            },
            "Redirecting…",
          ),
        ),
      ),
    );
  }

  return React.createElement(
    "div",
    {
      style: pageStyle,
      className: "flex items-center justify-center px-6 py-16 min-h-screen",
    },
    React.createElement(
      "div",
      {
        style: { width: "100%", maxWidth: "400px" },
      },
      // Row 1: page title
      React.createElement(
        "h1",
        {
          "data-wf": "b-0-0",
          style: {
            fontFamily: brand.fontHeading,
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            margin: "0 0 10px 0",
          },
        },
        "Set New Password",
      ),

      // Row 2: description
      React.createElement(
        "p",
        {
          "data-wf": "b-1-0",
          style: {
            fontSize: "14px",
            color: brand.neutralColor,
            lineHeight: 1.5,
            margin: "0 0 28px 0",
            maxWidth: "380px",
          },
        },
        "Enter a new password for your account. All existing sessions will be ended.",
      ),

      // Row 3: form
      React.createElement(
        "form",
        {
          "data-wf": "b-2-0",
          onSubmit: handleSubmit,
          noValidate: true,
          style: { width: "100%" },
        },
        // New password
        React.createElement(
          "div",
          { style: { marginBottom: "20px" } },
          React.createElement(
            "label",
            {
              htmlFor: "new-password",
              className: labelClass,
              style: labelStyle,
            },
            "New password",
          ),
          React.createElement("input", {
            id: "new-password",
            "data-wf": "i-2-0-0",
            type: "password",
            value: newPassword,
            onChange: function (e) {
              setNewPassword(e.target.value);
              if (errors.newPassword) {
                setErrors(Object.assign({}, errors, { newPassword: undefined }));
              }
            },
            autoComplete: "new-password",
            className: inputClass,
            style: getInputStyle(!!errors.newPassword),
            "aria-invalid": !!errors.newPassword,
            "aria-describedby": errors.newPassword ? "new-password-error" : undefined,
            disabled: submitting,
          }),
          errors.newPassword &&
            React.createElement(
              "p",
              {
                id: "new-password-error",
                role: "alert",
                style: {
                  fontSize: "12px",
                  color: brand.accentColor,
                  margin: "6px 0 0 0",
                  lineHeight: 1.4,
                },
              },
              errors.newPassword,
            ),
        ),

        // Confirm new password
        React.createElement(
          "div",
          { style: { marginBottom: "28px" } },
          React.createElement(
            "label",
            {
              htmlFor: "confirm-password",
              className: labelClass,
              style: labelStyle,
            },
            "Confirm new password",
          ),
          React.createElement("input", {
            id: "confirm-password",
            "data-wf": "i-2-0-1",
            type: "password",
            value: confirmPassword,
            onChange: function (e) {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors(Object.assign({}, errors, { confirmPassword: undefined }));
              }
            },
            autoComplete: "new-password",
            className: inputClass,
            style: getInputStyle(!!errors.confirmPassword),
            "aria-invalid": !!errors.confirmPassword,
            "aria-describedby": errors.confirmPassword ? "confirm-password-error" : undefined,
            disabled: submitting,
          }),
          errors.confirmPassword &&
            React.createElement(
              "p",
              {
                id: "confirm-password-error",
                role: "alert",
                style: {
                  fontSize: "12px",
                  color: brand.accentColor,
                  margin: "6px 0 0 0",
                  lineHeight: 1.4,
                },
              },
              errors.confirmPassword,
            ),
        ),

        // Row 4: submit button
        React.createElement(
          "button",
          {
            "data-wf": "b-3-0",
            type: "submit",
            disabled: submitting,
            style: {
              backgroundColor: brand.primaryColor,
              color: brand.backgroundColor,
              border: "2px solid " + brand.primaryColor,
              borderRadius: brand.radius,
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: brand.fontBody,
              cursor: submitting ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              opacity: submitting ? 0.5 : 1,
              transition: "opacity 0.15s ease",
            },
          },
          submitting
            ? "Resetting…"
            : React.createElement(
                React.Fragment,
                null,
                React.createElement(Icons.Check, { size: 16, "aria-hidden": true }),
                React.createElement("span", null, "Reset Password"),
              ),
        ),
      ),

      // Secondary link back
      React.createElement(
        "div",
        {
          style: {
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid " + brand.neutralColor + "22",
            fontSize: "13px",
            color: brand.neutralColor,
            lineHeight: 1.5,
          },
        },
        React.createElement("span", null, "Remembered your password? "),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              navigate("sign-in");
            },
            style: {
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "13px",
              fontFamily: brand.fontBody,
              color: brand.primaryColor,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            },
          },
          "Sign in",
        ),
      ),
    ),
  );
}
