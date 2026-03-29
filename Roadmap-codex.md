# Roadmap Codex

This file turns the ideas from [ROADMAP.md](/Users/manu/Documents/repos/tasks/ROADMAP.md) into a more concrete, implementation-focused plan based on the current codebase.

## 1. Environment separation and dev flow

Completed in a first usable version.

What is now in place:

- frontend override via `VITE_API_URL`
- backend env vars for table/region/email config
- separate dev Lambda (`TasksHandlerDev`)
- separate dev DynamoDB table (`tasks-dev`)
- separate dev API Gateway
- updated docs for the dev/live split

What may still be worth improving later:

- make live/dev deployment scripts and naming even more consistent
- document the exact dev API URL and AWS resources in one place
- decide whether the old live API Gateway stage should keep the historical `preprod` name

## 2. Make the API contract real

The repo already has an OpenAPI spec in [backend/openapi.yaml](/Users/manu/Documents/repos/tasks/backend/openapi.yaml), and generated frontend types in [shared/generated-types.ts](/Users/manu/Documents/repos/tasks/shared/generated-types.ts), which is a good start.

Progress so far:

- first-pass runtime validation is now in place in [backend/tasks-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.mjs)
- the main routing lambda has been split so Zod schemas and request helpers live in:
  - [backend/tasks-lambda/schemas.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/schemas.mjs)
  - [backend/tasks-lambda/http.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/http.mjs)
- Lambda packaging was updated so `zod` is included in the deployment artifact

What is still incomplete:

- the OpenAPI spec is not yet guaranteed to match the runtime validation exactly
- there are not yet tests covering invalid payloads / `400` responses
- the other Lambdas do not yet share the same schema or helper layer

Recommended improvements:

- Keep runtime validation in the lambda.
- Prefer Zod for request parsing and error messages.
- Either:
  - make Zod the source of truth and derive TypeScript types from it, or
  - keep OpenAPI as the source of truth and validate against it in the lambda too.
- Return structured `400` responses when payloads are invalid.

Why this matters:

- It prevents runtime crashes from malformed payloads.
- It aligns the frontend and backend around one contract instead of “spec + hope”.
- It will make future features like filtering easier to add safely.

## 3. Keep unchecking separated from GET /tasks

Completed for the main routing path.

What is now in place:

- `GET /tasks` in [backend/tasks-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.mjs) is read-only again
- recurring expiry and uncheck emails live in [backend/task-auto-uncheck-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-auto-uncheck-lambda/index.mjs)
- the weekly digest has its own scheduled lambda in [backend/task-digest-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-digest-lambda/index.mjs)

What may still be worth improving later:

- extract shared task mapping / frequency/date helpers into a common module
- make the scheduler path more explicit and better documented in AWS notes
- consider idempotency so a scheduler retry does not send duplicate notifications
- add clearer logging around scheduled runs

Why this still matters:

- The separation is now healthier, but scheduled behavior is still an area worth hardening and testing.

## 4. Frontend request handling cleanup

Completed in the current API layer.

What is now in place:

- `toggleTask` no longer triggers a redundant follow-up `GET`
- `deleteTask` awaits the server response and propagates failures properly
- the old delete-delay workaround in [src/components/Task.tsx](/Users/manu/Documents/repos/tasks/src/components/Task.tsx) is gone

What may still be worth improving later:

- add mutation-level tests around add/toggle/delete flows
- consider optimistic updates if the UI ever feels sluggish

Why this matters:

- The request helpers now behave more predictably.
- React Query is back to being the source of truth for refetching.

## 5. Centralize date and frequency logic

The repo already introduced time constants in [src/utils/constants.ts](/Users/manu/Documents/repos/tasks/src/utils/constants.ts), which is a good direction.

There is still duplicated business logic between frontend and backend:

- frequency-to-days conversion,
- next-uncheck calculation,
- rough month/year duration handling.

Recommended improvements:

- Move task scheduling/date logic into shared utilities.
- Reuse the same logic for:
  - sorting,
  - countdown display,
  - scheduler unchecking.
- Decide explicitly how month/year frequencies should behave:
  - fixed durations, or
  - calendar-aware dates.
- Decide explicitly which timezone defines “the day changes”.

Why this matters:

- It prevents frontend/backend drift.
- It will fix the “same hour as check time” issue more cleanly.
- It makes tests much more meaningful.

## 6. Fix the task-state data model

Completed in the chosen simplified form.

Chosen model:

- `checkedAt` means "currently checked since"
- `checkedAt = ""` means the task is currently due
- no long-term completion history is preserved after expiry
- the old `lastChecked` / `checked` fields are legacy compatibility concerns only

What is now in place:

- frontend grouping uses `checkedAt`
- API responses use `checkedAt`
- scheduled unchecking clears `checkedAt`
- digest logic no longer depends on historical completion semantics

What may still be worth improving later:

- remove transitional fallback support for `lastChecked` in backend reads/validation once the data is cleaned up
- backfill or clean legacy DynamoDB fields if desired

## 7. Tighten CORS

The roadmap note about CORS is correct: the lambda still returns `Access-Control-Allow-Origin: *`.

Recommended improvements:

- Move allowed origins into config.
- Return the matching allowed origin instead of `*`.
- Keep preflight headers consistent across all methods.
- If API Gateway is handling part of CORS, document clearly what is configured there versus in the lambda.

Why this matters:

- It is safer for production.
- It reduces confusion when debugging browser/API issues.

## 8. Add tag filtering

This looks like a very reachable feature.

The data model already supports tags:

- tags exist in the OpenAPI schema,
- tags are stored in DynamoDB,
- tags are displayed in the task UI.

Recommended improvements:

- Start with client-side filtering in the React app.
- Add a simple filter control above the task lists.
- Decide whether the filter should:
  - show one tag at a time,
  - support multiple tags,
  - or include an “untagged” view.
- Only add server-side filtering later if the dataset grows enough to justify it.

Why this matters:

- It is user-visible and valuable.
- It is much smaller than the backend architecture tasks.
- It can be shipped independently.

## 9. Improve tests where risk is highest

The current tests pass, but they only cover sorting logic in [src/utils/taskSorting.test.ts](/Users/manu/Documents/repos/tasks/src/utils/taskSorting.test.ts).

Recommended next tests:

- Lambda request validation tests for `POST`, `PUT`, and `DELETE`.
- Tests for uncheck date calculation.
- Tests for scheduler behavior and email triggering.
- A few frontend tests for add/toggle/delete flows.

Why this matters:

- Most current risk is in API behavior, not sorting.
- The uncheck/email feature is the area most likely to regress.

## Suggested implementation order

1. Add tag filtering.
2. Expand tests around backend behavior and scheduling.
3. Tighten the contract story by syncing OpenAPI, Zod, and tests.
4. Tighten CORS.
5. Extract shared date/frequency helpers if scheduler logic keeps growing.

## Short version

If only a few things get done soon, the best ones are:

- add tests around scheduling and validation,
- and ship a first tag filtering pass.
