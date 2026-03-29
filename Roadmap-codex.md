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

The gap is that the lambda still trusts request bodies too much:

- `POST` assumes `body.tags.map(...)` exists.
- `PUT` and `DELETE` also parse JSON and immediately use the result without validation.

Recommended improvements:

- Add runtime validation in the lambda.
- Prefer Zod for request parsing and error messages.
- Either:
  - make Zod the source of truth and derive TypeScript types from it, or
  - keep OpenAPI as the source of truth and validate against it in the lambda too.
- Return structured `400` responses when payloads are invalid.

Why this matters:

- It prevents runtime crashes from malformed payloads.
- It aligns the frontend and backend around one contract instead of “spec + hope”.
- It will make future features like filtering easier to add safely.

## 3. Finish separating unchecking from GET /tasks

This is the biggest backend design improvement.

At the moment, `GET /tasks` does more than read:

- it scans tasks,
- computes which tasks should be unchecked,
- updates DynamoDB,
- and sends emails.

That logic currently lives in [backend/tasks-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.mjs).

Recommended improvements:

- Make `GET /tasks` read-only.
- Move all unchecking and email sending to the scheduled lambda / EventBridge path.
- Extract shared logic into a common module:
  - task mapping from DynamoDB items,
  - frequency/date calculations,
  - “should uncheck” logic,
  - email payload construction.

Additional backend cleanup:

- `sendEmail(...)` should be awaited where failure matters.
- Add clear logging around scheduled runs.
- Consider idempotency so a scheduler retry does not send duplicate notifications.

Why this matters:

- Reads should not mutate state.
- The current behavior depends on traffic timing.
- A dedicated scheduled flow is easier to reason about and test.

## 4. Fix async request handling in the frontend

There are a couple of small but important reliability issues in the frontend API layer:

- `deleteTask` does not await the `fetch`.
- `deleteTask` also swallows server errors.
- `toggleTask` calls `fetchTasks()` after the update, but the result is not used.

This likely explains the workaround in [src/components/Task.tsx](/Users/manu/Documents/repos/tasks/src/components/Task.tsx) where deletion waits 300ms before invalidating the query.

Recommended improvements:

- Make all request helpers consistently `await` the response.
- Throw on non-OK responses.
- Let React Query handle refetching/invalidation.
- Remove the artificial `setTimeout` once delete behavior is reliable.

Why this matters:

- It removes race conditions.
- It simplifies the UI code.
- It makes user actions feel more predictable.

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

## 6. Fix the `checked` / `lastChecked` data model

This is now worth calling out explicitly because the current semantics are muddy.

Right now:

- `checked` is meant to represent whether the task is currently done
- `lastChecked` sounds like it should represent the last completion timestamp

But during auto-uncheck, the code resets `lastChecked` back to an empty string:

- [backend/tasks-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/tasks-lambda/index.mjs)
- [backend/task-auto-uncheck-lambda/index.mjs](/Users/manu/Documents/repos/tasks/backend/task-auto-uncheck-lambda/index.mjs)

That means `lastChecked` is not really “last completed at”; it behaves more like “currently checked since”, which is much less intuitive and throws away useful history.

Why this is a problem:

- the field name suggests one meaning, but the implementation uses another
- completion history is lost when recurring tasks become due again
- some frontend code uses `lastChecked` almost as a proxy for `checked`, which only works because the timestamp gets erased

Recommended improvements:

- decide what `lastChecked` should mean
- if it truly means “last time this task was completed”, stop clearing it during auto-uncheck
- let `checked` represent only the current due/done state
- if needed, add a separate derived notion such as `dueAt` or compute due status from `lastChecked + frequency`
- update frontend grouping and sorting to rely on `checked` for current state, not `lastChecked`

Why this matters:

- the current model does not make conceptual sense for recurring tasks
- it makes the UI and backend logic harder to reason about
- it blocks future features like a useful digest or completion history

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

1. Runtime validation in the lambda.
2. Fix the `checked` / `lastChecked` data model.
3. Make `GET /tasks` read-only and move unchecking fully to the scheduler.
4. Fix frontend async request handling and remove the delete delay hack.
5. Add tag filtering.
6. Expand tests around backend behavior and scheduling.

## Short version

If only a few things get done soon, the best ones are:

- validate request bodies at runtime,
- fix the `checked` / `lastChecked` semantics,
- remove side effects from `GET /tasks`,
- and fix the frontend request helpers so they behave consistently.
