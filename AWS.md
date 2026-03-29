# AWS Notes

## Current setup

- region: `eu-north-1`
- live lambda: `TasksHandler`
- dev lambda: `TasksHandlerDev`
- live DynamoDB table: `tasks`
- dev DynamoDB table: `tasks-dev`
- live API Gateway: uses a stage historically named `preprod`
- dev API Gateway: separate from live, used for local development

Important note:

- the `preprod` name is historical but in practice, that old `preprod` stage behaves like the current live API
- live and dev are now split more clearly by using separate Lambda/API/DynamoDB resources

## Frontend config

The frontend can point to a specific backend with `VITE_API_URL`.

Typical local setup:

- create `.env.local`
- set `VITE_API_URL` to the dev API `/tasks` endpoint

If `VITE_API_URL` is not set, the app falls back to the old live URL hardcoded in the frontend.

## Task state semantics

The backend now uses `checkedAt` as the meaningful current-state field:

- `checkedAt` present -> task is currently checked
- `checkedAt` empty -> task is currently due
- scheduled unchecking clears `checkedAt`

## Lambda responsibilities

- `TasksHandler` / `TasksHandlerDev`: HTTP CRUD only
- `TaskAutoUncheck`: scheduled scan of the table, recurring expiry, and uncheck emails
- `TaskDigest`: scheduled weekly digest email

`GET /tasks` is now intended to stay read-only. If unchecking or task emails behave oddly, the first place to inspect is the scheduler path and `TaskAutoUncheck`, not the routing lambda.

## Deploying

When modifying Lambda code:

- live: `npm run push:lambda`
- dev: `npm run push:lambda-dev`
- auto-uncheck: `npm run push:lambda:uncheck`
- digest: `npm run push:lambda:digest`

When modifying API Gateway settings:

- redeploy the API if needed, depending on the API Gateway type/config
- double-check the actual deployed endpoint afterward

## Permissions

The Lambda execution role must have permission to access the relevant DynamoDB table:

- live Lambda -> `tasks`
- dev Lambda -> `tasks-dev`

If email sending is used, the Lambda also needs the right SES permissions and verified sender setup.


## Handy identifiers

- live API Gateway id in the repo: `6s6jd82e80`
- live stage name in the repo: `preprod`
- SES sender in the code: `tasks@moulindelingoult.fr`

account created on Aug 15 (free tier should expire 6 months later)
