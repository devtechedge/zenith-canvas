# Security Policy

## Supported version

Security fixes are applied to the latest `main` branch.

## Reporting a vulnerability

Do not publish suspected vulnerabilities in a public issue. Contact the repository owner privately with reproduction steps, impact, and any suggested mitigation.

## Current security boundary

Zenith Canvas is a local-first browser application. Workspace data is stored in the browser and is not protected by account authentication, server-side authorization, or end-to-end encryption. Do not store secrets, financial data, or other sensitive personal information in a canvas.

Any future sharing, authentication, file upload, or server-side integration must include server-enforced authorization, input validation, rate limiting, audit logging, and secret management before production use.
