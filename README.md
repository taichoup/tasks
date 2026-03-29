# Tasks app

TS + React + Vite + AWS (Lambdas, DynamoDB)

## Some useful commands

```bash
npm run dev # local server
npm run test # unit tests
npm run generate:types # generate TS typings (in shared folder) based on API spec (openapi.yaml)
npm run push:lambda # build and deploy the live lambda
npm run push:lambda-dev # build and deploy the dev lambda
npm run push:lambda:uncheck # build and deploy the auto-uncheck lambda
npm run push:lambda:digest # build and deploy the weekly digest lambda
```

## Backend structure

The repo now contains three backend Lambdas:

- `backend/tasks-lambda/`: main HTTP routing lambda (`TasksHandler` / `TasksHandlerDev`)
- `backend/task-auto-uncheck-lambda/`: scheduled auto-uncheck lambda (`TaskAutoUncheck`)
- `backend/task-digest-lambda/`: scheduled weekly digest lambda (`TaskDigest`)

The main routing lambda has been split into smaller files:

- `index.mjs`: main handler and DynamoDB/SES flow
- `schemas.mjs`: Zod request schemas
- `http.mjs`: JSON parsing and validation error helpers
- `config.mjs`: env-based config

## Task state model

The project now treats `checkedAt` as the source of truth for current task state:

- `checkedAt = ""` means the task is currently due
- `checkedAt = ISO timestamp` means the task is currently checked since that moment
- when a task expires, `checkedAt` is cleared again

This is intentionally not a long-term completion history model.

## Lambda packaging

Lambda packaging is no longer just a single-file zip.

- `build:lambda` now packages the whole `backend/tasks-lambda/` directory
- runtime dependencies needed by the Lambda, such as `zod`, are included in the zip
- the uncheck and digest Lambdas are also packaged by zipping their whole directory contents

This matters because runtime validation now happens inside the Lambda, so `zod` must be present in the deployed artifact.

## Some useful documentation

See [AWS.md](./AWS.md) for info about the AWS config  
See [Roadmap.md](./ROADMAP.md) for info about the next dev steps for this project
