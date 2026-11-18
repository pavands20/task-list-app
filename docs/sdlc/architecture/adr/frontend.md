<!-- sdlc:auto:start adr -->
# ADR-0001: Use React 19 for Frontend

Status: Accepted  
Date: 2026-11-18

## Context and Problem Statement

Which Frontend technology does the project use? Decided in architecture v1.

## Considered Options

- React 19

## Decision Outcome

Chosen option: React 19, because Approved stack. Renders the interactive per-user task list with in-place toggling of done/active, active/completed filtering and due-date sort without page reloads, and stores the opaque session token to send as Authorization: Bearer. Built as a static SPA and served from its own origin.

## Consequences

A separate SPA origin from the API means no shared cookies, so the token-in-body plus Bearer-header session model is used; this is intentional and matches the deployment.
<!-- sdlc:auto:end adr -->