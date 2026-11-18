<!-- sdlc:auto:start adr -->
# ADR-0002: Use FastAPI 0.115 for Backend

Status: Accepted  
Date: 2026-11-18

## Context and Problem Statement

Which Backend technology does the project use? Decided in architecture v1.

## Considered Options

- FastAPI 0.115

## Decision Outcome

Chosen option: FastAPI 0.115, because Approved stack. Provides the auth and task CRUD endpoints with little ceremony, validates request bodies via Pydantic, enforces per-user ownership, and issues and validates opaque session tokens stored in PostgreSQL.

## Consequences

Server-side session lookups add a DB round-trip per request, which is negligible at this low scale and gives immediate revocation on sign-out, reset and deletion.
<!-- sdlc:auto:end adr -->