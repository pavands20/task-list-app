<!-- sdlc:auto:start adr -->
# ADR-0004: Use AWS for Cloud

Status: Accepted  
Date: 2026-11-18

## Context and Problem Statement

Which Cloud technology does the project use? Decided in architecture v1.

## Considered Options

- AWS

## Decision Outcome

Chosen option: AWS, because Approved stack. Hosts the static SPA (S3/CloudFront), the API (App Runner) and the database (RDS PostgreSQL) in one place, scaling down to near-nothing when idle, with encryption in transit and at rest.

## Consequences

App Runner cold starts can add brief latency after idle periods, acceptable for a free low-scale personal app.
<!-- sdlc:auto:end adr -->