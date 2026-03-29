- needs some sort of contract between back and front. I did add an OpenAPI thing but am not sure how it works.
    - first pass of runtime validation is now in place in `TasksHandler` with Zod
    - still to do:
        - decide whether Zod or OpenAPI is the real source of truth
        - align the OpenAPI spec with the runtime validation rules
        - add tests for invalid payloads and 400 responses
- needs something more robust for CORS, so as not to have to allow *
- add a filter based on tags.
- use Zod for schema validation and typing generation?
    - runtime validation has started in the main routing lambda
    - typing generation / overall schema strategy is still unresolved

- update Mar 29: dev/live separation is now in place in a first version
    - separate dev lambda: `TasksHandlerDev`
    - separate dev DynamoDB table: `tasks-dev`
    - separate dev API Gateway
    - frontend can point to dev via `VITE_API_URL`
    - lambda packaging was updated so runtime dependencies like `zod` can ship with the deployed artifact
    - task state semantics were clarified: `checkedAt` now means "currently checked since", and the old `checked` / `lastChecked` model is being phased out
    - the main routing lambda is now read-only again for `GET /tasks`; scheduled unchecking stays in `TaskAutoUncheck`


- update Oct 8: the original uncheck/email flow worked, but was tied to `GET /tasks`
    - this is now cleaned up in favor of the scheduled lambda path
    - remaining work is about scheduler robustness and shared logic, not routing-side unchecking anymore


- update Oct 9: j'ai créé une nouvelle lambda pour le unchecking, qui est invoquée par
un EventBridge Scheduler 1x par jour. La logique d'unchecking a maintenant été retirée du routeur ; il reste surtout a mieux documenter / tester le scheduler et a mutualiser le code commun s'il y en a (entre les lambdas)
