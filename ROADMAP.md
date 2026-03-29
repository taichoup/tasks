# Roadmap

This file combines the original project notes with a more concrete, implementation-focused plan based on the current codebase.

## Snapshot

Completed recently:

- dev/live separation is in place in a first usable version
- runtime validation has started in `TasksHandler` with Zod
- the main routing lambda is read-only again for `GET /tasks`
- task state semantics were simplified around `checkedAt`
- frontend request helpers were cleaned up
- a first client-side tag filter is now in place
- backend and frontend test coverage was expanded around requests and handler behavior
- the `DELETE /tasks/{id}` contract now matches the route shape better

Best next candidates:

1. Extract shared date/frequency helpers across lambdas and frontend.
2. Tighten CORS.
3. Keep tightening the contract story where OpenAPI and runtime still drift.
4. Expand scheduler-focused tests.
5. Decide whether any remaining live/dev AWS naming should be cleaned up.

## Historical notes

### Mar 29

- separate dev lambda: `TasksHandlerDev`
- separate dev DynamoDB table: `tasks-dev`
- separate dev API Gateway
- frontend can point to dev via `VITE_API_URL`
- lambda packaging was updated so runtime dependencies like `zod` can ship with the deployed artifact
- task state semantics were clarified: `checkedAt` now means "currently checked since", and the old `checked` / `lastChecked` model is being phased out
- the main routing lambda is now read-only again for `GET /tasks`; scheduled unchecking stays in `TaskAutoUncheck`

### Oct 8

- the original uncheck/email flow worked, but was tied to `GET /tasks`
- this is now cleaned up in favor of the scheduled lambda path
- remaining work is about scheduler robustness and shared logic, not routing-side unchecking anymore

### Oct 9

- a dedicated uncheck lambda was created and is invoked by an EventBridge Scheduler once per day
- unchecking logic has now been removed from the router
- remaining cleanup is mainly about documentation, tests, and mutualizing shared logic between lambdas

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
- `DELETE /tasks/{id}` now uses the path parameter instead of a request body
- OpenAPI and generated frontend types have been updated for the newer `checkedAt` model

What is still incomplete:

- the OpenAPI spec is not yet guaranteed to match the runtime validation exactly in every detail
- the other Lambdas do not yet share the same schema or helper layer
- there are no contract-level tests asserting that OpenAPI and runtime validation stay in sync automatically

Recommended improvements:

- keep runtime validation in the lambda
- prefer Zod for request parsing and error messages
- either make Zod the source of truth and derive TypeScript types from it, or keep OpenAPI as the source of truth and validate against it in the lambda too
- return structured `400` responses when payloads are invalid

Why this matters:

- it prevents runtime crashes from malformed payloads
- it aligns the frontend and backend around one contract instead of "spec + hope"
- it will make future features like filtering easier to add safely

## 3. Keep unchecking separated from GET /tasks

Completed for the main routing path.

What is now in place:

- `GET /tasks` in [backend/tasks-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.mjs) is read-only again
- recurring expiry and uncheck emails live in [backend/task-auto-uncheck-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-auto-uncheck-lambda/index.mjs)
- the weekly digest has its own scheduled lambda in [backend/task-digest-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-digest-lambda/index.mjs)

What may still be worth improving later:

- extract shared task mapping / frequency/date helpers into a common module
- make the scheduler path more explicit and better documented
- consider idempotency so a scheduler retry does not send duplicate notifications
- add clearer logging around scheduled runs

Why this still matters:

- the separation is now healthier, but scheduled behavior is still an area worth hardening and testing

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

- the request helpers now behave more predictably
- React Query is back to being the source of truth for refetching

## 5. Centralize date and frequency logic

This is now the next main cleanup.

The repo already introduced time constants in [src/utils/constants.ts](/Users/manu/Documents/repos/tasks/src/utils/constants.ts), which is a good direction.

There is still duplicated business logic between frontend and backend:

- frequency-to-days conversion
- next-uncheck calculation
- rough month/year duration handling

Recommended improvements:

- move task scheduling/date logic into shared utilities
- reuse the same logic for sorting, countdown display, and scheduler unchecking
- mutualize task mapping / recurrence helpers across:
  - [backend/tasks-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.mjs)
  - [backend/task-auto-uncheck-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-auto-uncheck-lambda/index.mjs)
  - [backend/task-digest-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-digest-lambda/index.mjs)
  - [src/components/Task.tsx](/Users/manu/Documents/repos/tasks/src/components/Task.tsx)
- decide explicitly how month/year frequencies should behave: fixed durations or calendar-aware dates
- decide explicitly which timezone defines "the day changes"

Why this matters:

- it prevents frontend/backend drift
- it will fix the "same hour as check time" issue more cleanly
- it makes tests much more meaningful

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
- clean any remaining legacy DynamoDB fields if needed

## 7. Tighten CORS

The roadmap note about CORS is still correct: the lambda returns `Access-Control-Allow-Origin: *`.

Recommended improvements:

- move allowed origins into config
- return the matching allowed origin instead of `*`
- keep preflight headers consistent across all methods
- if API Gateway is handling part of CORS, document clearly what is configured there versus in the lambda

Why this matters:

- it is safer for production
- it reduces confusion when debugging browser/API issues

## 8. Add tag filtering

Completed in a first client-side version.

The data model already supports tags:

- tags exist in the OpenAPI schema
- tags are stored in DynamoDB
- tags are displayed in the task UI

What is now in place:

- a simple client-side filter control above the task lists
- one selected tag at a time
- `Tous` and `Sans tag` views

What may still be worth improving later:

- decide whether multi-tag filtering is worth it
- improve the display labels/copy for tags if needed
- only add server-side filtering later if the dataset grows enough to justify it

Why this matters:

- it is user-visible and valuable
- it is much smaller than the backend architecture tasks
- it can be shipped independently

## 9. Improve tests where risk is highest

Progress so far:

- sorting logic is covered in [src/utils/taskSorting.test.ts](/Users/manu/Documents/repos/tasks/src/utils/taskSorting.test.ts)
- request helper behavior is covered in [src/api/requests.test.ts](/Users/manu/Documents/repos/tasks/src/api/requests.test.ts)
- request parsing / schema behavior is covered in:
  - [backend/tasks-lambda/http.test.ts](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/http.test.ts)
  - [backend/tasks-lambda/schemas.test.ts](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/schemas.test.ts)
  - [backend/tasks-lambda/index.test.ts](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.test.ts)

Recommended next tests:

- tests for uncheck date calculation
- tests for scheduler behavior and email triggering
- a few component-level frontend tests around filtering and task rendering

Why this matters:

- most current risk is in API behavior, not sorting
- the uncheck/email feature is the area most likely to regress

## Short version

If only a few things get done soon, the best ones are:

- extract the shared scheduling/date logic
- add scheduler-focused tests
