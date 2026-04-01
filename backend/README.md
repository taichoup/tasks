The three Lambdas and their roles:

- `tasks-lambda/`: handles all HTTP requests (CRUD). Handler: `tasks-lambda/index.handler`
- `task-auto-uncheck-lambda/`: runs daily via EventBridge Scheduler, clears `checkedAt` on expired tasks and sends an email per unchecked task. Handler: `task-auto-uncheck-lambda/index.handler`
- `task-digest-lambda/`: runs weekly via EventBridge Scheduler, sends a prioritized email digest of upcoming and overdue tasks. Handler: `task-digest-lambda/index.handler`

Shared code in `backend/shared/`:

- `config.ts`: reads required env vars (`TASKS_TABLE_NAME`, `EMAIL_FROM`, `EMAIL_TO`) and throws on cold start if any are missing
- `taskUtils.ts`: `normalizeTask` (DynamoDB item → Task object) and `convertFrequencyToDays`

All source files are TypeScript. Build with `npm run build:backend` from the repo root.
