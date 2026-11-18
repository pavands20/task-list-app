<!-- sdlc:auto:start adr -->
# ADR-0003: Use PostgreSQL 16 for Database

Status: Accepted  
Date: 2026-11-18

## Context and Problem Statement

Which Database technology does the project use? Decided in architecture v1.

## Considered Options

- PostgreSQL 16

## Decision Outcome

Chosen option: PostgreSQL 16, because Approved stack. Stores users, hashed sessions, reset tokens and tasks as simple structured rows, with a unique email index, cascade delete for full account removal, and a composite index for the due-date-then-creation-time sort.

## Consequences

A relational DB is slightly heavier than a key-value store for sessions, but keeping sessions in PostgreSQL avoids adding any extra service and gives durable, revocable tokens.
<!-- sdlc:auto:end adr -->