# Tasks app

TS + React + Vite + AWS (Lambdas, DynamoDB)

## Useful commands

```bash
npm run dev # local server
npm run test # unit tests
npm run generate:types # generate TS typings in shared/ from backend/openapi.yaml
npm run push:lambda # build and deploy the live routing lambda
npm run push:lambda-dev # build and deploy the dev routing lambda
npm run push:lambda:uncheck # build and deploy the auto-uncheck lambda
npm run push:lambda:digest # build and deploy the weekly digest lambda
```

## Backend structure

The repo now contains three backend Lambdas:

- `backend/tasks-lambda/`: main HTTP routing lambda (`TasksHandler` / `TasksHandlerDev`)
- `backend/task-auto-uncheck-lambda/`: scheduled auto-uncheck lambda (`TaskAutoUncheck`)
- `backend/task-digest-lambda/`: scheduled weekly digest lambda (`TaskDigest`)

Responsibilities are split like this:

- `TasksHandler` / `TasksHandlerDev`: HTTP CRUD only
- `TaskAutoUncheck`: recurring expiry and uncheck emails
- `TaskDigest`: scheduled weekly digest email

`GET /tasks` is intended to stay read-only. If unchecking or task emails behave oddly, the first place to inspect is the scheduler path and `TaskAutoUncheck`, not the routing lambda.

The main routing lambda has been split into smaller files:

- `index.mjs`: main HTTP handler and DynamoDB CRUD flow
- `schemas.mjs`: Zod request schemas
- `http.mjs`: JSON parsing and validation error helpers
- `config.mjs`: env-based config

## Task state model

The project treats `checkedAt` as the source of truth for current task state:

- `checkedAt = ""` means the task is currently due
- `checkedAt = ISO timestamp` means the task is currently checked since that moment
- when a task expires, `checkedAt` is cleared again

This is intentionally not a long-term completion history model.

## AWS setup

### Current resources

- region: `eu-north-1`
- live lambda: `TasksHandler`
- dev lambda: `TasksHandlerDev`
- live DynamoDB table: `tasks`
- dev DynamoDB table: `tasks-dev`
- live API Gateway: uses a stage historically named `preprod`
- dev API Gateway: separate from live, used for local development

Important note:

- the `preprod` name is historical but in practice that old stage behaves like the current live API
- live and dev are now split more clearly by using separate Lambda/API/DynamoDB resources

### Frontend config

The frontend can point to a specific backend with `VITE_API_URL`.

Typical local setup:

- create `.env.local`
- set `VITE_API_URL` to the dev API `/tasks` endpoint

If `VITE_API_URL` is not set, the app falls back to the old live URL hardcoded in the frontend.

### Deploying

When modifying Lambda code:

- live: `npm run push:lambda`
- dev: `npm run push:lambda-dev`
- auto-uncheck: `npm run push:lambda:uncheck`
- digest: `npm run push:lambda:digest`

When modifying API Gateway settings:

- redeploy the API if needed, depending on the API Gateway type/config
- double-check the actual deployed endpoint afterward

### Permissions

The Lambda execution role must have permission to access the relevant DynamoDB table:

- live Lambda -> `tasks`
- dev Lambda -> `tasks-dev`

If email sending is used, the Lambda also needs the right SES permissions and verified sender setup.

### Handy identifiers

- live API Gateway id in the repo: `6s6jd82e80`
- live stage name in the repo: `preprod`
- SES sender in the code: `tasks@moulindelingoult.fr`

Account created on Aug 15. Free-tier timing may still matter depending on the AWS account state.

## Lambda packaging

Lambda packaging is no longer just a single-file zip.

- `build:lambda` packages the whole `backend/tasks-lambda/` directory
- runtime dependencies needed by the Lambda, such as `zod`, are included in the zip
- the uncheck and digest Lambdas are also packaged by zipping their whole directory contents

This matters because runtime validation now happens inside the Lambda, so `zod` must be present in the deployed artifact.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the current prioritized next steps and project history.
