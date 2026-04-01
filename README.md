# Tasks app

TS + React + Vite + AWS (Lambdas, DynamoDB)

## Useful commands

```bash
npm run dev                  # local frontend dev server
npm run test                 # unit tests
npm run generate:types       # generate TS typings in shared/ from backend/openapi.yaml
npm run build:backend        # compile backend TypeScript (outputs to dist/lambda-ts/)
npm run push:lambda          # build and deploy the live routing lambda
npm run push:lambda-dev      # build and deploy the dev routing lambda
npm run push:lambda:uncheck  # build and deploy the auto-uncheck lambda
npm run push:lambda:digest   # build and deploy the weekly digest lambda
```

## Backend structure

The repo contains three backend Lambdas:

- `backend/tasks-lambda/`: main HTTP routing lambda (`TasksHandler` / `TasksHandlerDev`)
- `backend/task-auto-uncheck-lambda/`: scheduled auto-uncheck lambda (`TaskAutoUncheck`)
- `backend/task-digest-lambda/`: scheduled weekly digest lambda (`TaskDigest`)

Shared backend code lives in `backend/shared/`:

- `config.ts`: env-based config — reads required env vars and throws on startup if any are missing
- `taskUtils.ts`: shared `normalizeTask` (DynamoDB → Task) and `convertFrequencyToDays` helpers

The main routing lambda is split into:

- `index.ts`: main HTTP handler and DynamoDB CRUD flow
- `schemas.ts`: Zod request schemas
- `http.ts`: JSON parsing and validation error helpers

Responsibilities are split like this:

- `TasksHandler` / `TasksHandlerDev`: HTTP CRUD only
- `TaskAutoUncheck`: recurring expiry and uncheck emails
- `TaskDigest`: scheduled weekly digest email

`GET /tasks` is read-only. If unchecking or task emails behave oddly, the first place to inspect is the scheduler path and `TaskAutoUncheck`, not the routing lambda.

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

### Lambda handler configuration

All three Lambdas (and `TasksHandlerDev`) use a subdirectory handler path due to the shared module structure:

| Lambda | Handler |
|---|---|
| `TasksHandler` | `tasks-lambda/index.handler` |
| `TasksHandlerDev` | `tasks-lambda/index.handler` |
| `TaskAutoUncheck` | `task-auto-uncheck-lambda/index.handler` |
| `TaskDigest` | `task-digest-lambda/index.handler` |

### Lambda environment variables

All Lambdas require these to be set in AWS (Configuration → Environment variables):

| Variable | Used by |
|---|---|
| `TASKS_TABLE_NAME` | all three |
| `EMAIL_FROM` | TaskAutoUncheck, TaskDigest |
| `EMAIL_TO` | TaskAutoUncheck, TaskDigest |
| `DIGEST_MAX_TASKS` | TaskDigest (optional, defaults to 10) |

`AWS_REGION` is injected automatically by the Lambda runtime.

### Frontend config

The frontend requires `VITE_API_URL` to be set at build time — it throws on startup if missing.

Typical local setup:

- copy `.env.example` to `.env.local`
- set `VITE_API_URL` to your API `/tasks` endpoint

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

- live Lambda → `tasks`
- dev Lambda → `tasks-dev`

If email sending is used, the Lambda also needs the right SES permissions and verified sender setup.

## Lambda packaging

Lambda source files are TypeScript (`.ts`). The packaging pipeline is:

1. `npm run build:backend` — compiles all backend TypeScript to `dist/lambda-ts/` using `tsconfig.lambda.json`
2. `scripts/package-lambda.sh` — assembles the zip from compiled output

The zip structure preserves directory layout so that `../shared/` imports resolve correctly at runtime:

```
tasks-lambda/
  index.js, http.js, schemas.js
shared/
  config.js, taskUtils.js
package.json          ← {"type":"module"} so the runtime treats files as ESM
node_modules/
  zod/                ← only tasks-lambda needs this; the others don't bundle dependencies
```

The `push:lambda*` scripts run compilation and deployment in one step.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the current prioritized next steps and project history.
