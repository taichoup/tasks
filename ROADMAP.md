# Roadmap

This file combines the original project notes with a more concrete, implementation-focused plan based on the current codebase.

## Snapshot

Completed recently:

- dev/live separation is in place in a first usable version
- runtime validation in `TasksHandler` with Zod
- the main routing lambda is read-only again for `GET /tasks`
- task state semantics simplified around `checkedAt`
- frontend request helpers cleaned up
- client-side tag filter in place
- backend and frontend test coverage expanded around requests and handler behavior
- `DELETE /tasks/{id}` contract matches the route shape
- shared `normalizeTask` and `convertFrequencyToDays` extracted to `backend/shared/taskUtils.ts`
- hardcoded PII and secrets removed; config centralized in `backend/shared/config.ts`
- all backend source files converted from `.mjs` to TypeScript
- `TaskAutoUncheck` now paginates DynamoDB scans and has dedicated unit tests
- `TaskAutoUncheck` updates DynamoDB even if SES email delivery fails
- frontend add-task logic extracted into `src/components/AddTaskForm.tsx`
- linting migrated from ESLint to `oxlint`; Prettier added for formatting
- checked-task sorting tests now reflect the current "time remaining until auto-uncheck" behavior

Best next candidates:

1. Tighten CORS (whitelist origins instead of `*`).
2. Add tests for the digest lambda and broader component-level frontend behavior.
3. Add idempotency to scheduled lambdas so retries don't send duplicate emails.
4. Keep tightening the contract story where OpenAPI and runtime still drift.
5. Remove DEBUG console.logs from production code.

## Historical notes

### Apr 11-12

- `TaskAutoUncheck` scan logic fixed to read all DynamoDB scan pages instead of a single page
- `TaskAutoUncheck` now updates `checkedAt` before attempting SES notification, so SES failures no longer block expiry processing
- dedicated unit tests added for the auto-uncheck lambda covering paginated scans and SES failures
- CloudWatch investigation found an AWS handler typo can fully prevent scheduled execution:
  `task-auto-uncheck-lambda/index.handler` is correct, while `tasks-auto-uncheck-lambda/index.handler` is not
- frontend add-task form extracted from `App.tsx` into `src/components/AddTaskForm.tsx`
- linting migrated from ESLint to `oxlint`; `.oxlintrc.json` added; Prettier scripts added
- checked-task sorting tests updated to assert sorting by remaining time until auto-uncheck rather than raw `checkedAt` recency

### Apr 2

- backend tests were broken due to `zod` not being installed; fixed with `npm install`
- `normalizeTask` and `convertFrequencyToDays` extracted into `backend/shared/taskUtils.ts`, removing duplication across all three lambdas
- all hardcoded PII removed (`EMAIL_FROM`, `EMAIL_TO`, API Gateway URL); config centralized in `backend/shared/config.ts` with required env var validation
- `VITE_API_URL` is now required at build time; the frontend throws on startup if it is missing
- all backend `.mjs` files converted to TypeScript; new `tsconfig.lambda.json` compiles to `dist/lambda-ts/`
- packaging script updated to copy compiled `.js` output and include `{"type":"module"}` `package.json` in the zip
- Lambda handler paths updated from `index.handler` to e.g. `tasks-lambda/index.handler` to match the new zip structure

### Mar 29

- separate dev lambda: `TasksHandlerDev`
- separate dev DynamoDB table: `tasks-dev`
- separate dev API Gateway
- frontend can point to dev via `VITE_API_URL`
- lambda packaging was updated so runtime dependencies like `zod` can ship with the deployed artifact
- task state semantics clarified: `checkedAt` now means "currently checked since"
- the main routing lambda is now read-only again for `GET /tasks`

### Oct 8

- the original uncheck/email flow worked, but was tied to `GET /tasks`
- this is now cleaned up in favor of the scheduled lambda path

### Oct 9

- a dedicated uncheck lambda was created and is invoked by an EventBridge Scheduler once per day
- unchecking logic removed from the router

## 1. Environment separation and dev flow

Completed.

What is in place:

- frontend override via `VITE_API_URL` (required — throws if missing)
- backend env vars for table/email config validated at cold start
- separate dev Lambda (`TasksHandlerDev`)
- separate dev DynamoDB table (`tasks-dev`)
- separate dev API Gateway

What may still be worth improving later:

- document the exact dev API URL and AWS resources in one place
- decide whether the old live API Gateway stage should keep the historical `preprod` name
- decide whether dev should get its own scheduled auto-uncheck path; today it does not, so dev sorting/state can drift from prod over time

## 2. Make the API contract real

Progress so far:

- runtime validation in `backend/tasks-lambda/schemas.ts` and `http.ts`
- `zod` included in the deployment artifact
- `DELETE /tasks/{id}` uses the path parameter
- OpenAPI and generated frontend types updated for the `checkedAt` model

What is still incomplete:

- the OpenAPI spec is not guaranteed to match runtime validation exactly
- no contract-level tests asserting OpenAPI and Zod stay in sync automatically

Recommended improvements:

- either make Zod the source of truth and generate the OpenAPI spec from it, or add tests that verify parity
- return structured `400` responses with field-level errors surfaced in the UI

## 3. Keep unchecking separated from GET /tasks

Completed.

What is in place:

- `GET /tasks` in `backend/tasks-lambda/index.ts` is read-only
- recurring expiry and uncheck emails in `backend/task-auto-uncheck-lambda/index.ts`
- weekly digest in `backend/task-digest-lambda/index.ts`
- auto-uncheck tests cover scan pagination and SES failure handling

What may still be worth improving later:

- add idempotency so a scheduler retry does not send duplicate notifications
- add clearer logging around scheduled runs
- add tests for the digest lambda
- consider detecting/validating expected Lambda handler paths as part of deploy docs or tooling

## 4. Frontend request handling cleanup

Completed.

What is in place:

- `toggleTask` no longer triggers a redundant follow-up `GET`
- `deleteTask` awaits the server response and propagates failures properly

What may still be worth improving later:

- add mutation-level tests around add/toggle/delete flows
- consider optimistic updates if the UI ever feels sluggish

## 5. Centralize date and frequency logic

Completed for the backend.

What is in place:

- `normalizeTask` and `convertFrequencyToDays` live in `backend/shared/taskUtils.ts`
- all three lambdas import from the shared module

What may still be worth improving later:

- the frontend (`src/utils/taskSorting.ts`, `src/components/Task.tsx`) still has its own frequency-to-days conversion — this could be unified with the backend shared logic
- decide explicitly how month/year frequencies should behave: fixed durations or calendar-aware dates
- decide explicitly which timezone defines "the day changes"

## 6. Fix the task-state data model

Completed.

Chosen model:

- `checkedAt` means "currently checked since"
- `checkedAt = ""` means the task is currently due
- no long-term completion history is preserved after expiry

## 7. Tighten CORS

Still pending.

Currently all Lambda responses return `Access-Control-Allow-Origin: *`.

Recommended improvements:

- move allowed origins into config
- return the matching allowed origin instead of `*`
- keep preflight headers consistent across all methods

## 8. Add tag filtering

Completed in a first client-side version.

What may still be worth improving later:

- decide whether multi-tag filtering is worth it
- only add server-side filtering later if the dataset grows enough to justify it

## 9. Improve tests where risk is highest

Progress so far:

- sorting and filtering logic covered
- request helper behavior covered
- request parsing and schema behavior covered in `backend/tasks-lambda/*.test.ts`

Recommended next tests:

- digest lambda priority and email composition
- scheduler-facing behavior that is hard to observe locally
- component-level frontend tests around filtering and task rendering

Why this matters:

- the uncheck/email feature is the area most likely to regress silently

## Short version

If only a few things get done soon, the best ones are:

- tighten CORS
- add tests for the scheduled lambdas
- add idempotency to the scheduled lambdas
