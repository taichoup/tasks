- needs some sort of contract between back and front. I did add an OpenAPI thing but am not sure how it works. We need schema validation on the lambda side, too. Look at Request Validator in API Gateway, for every method's method request section. Maybe that's a good lead.
- needs something more robust for CORS, so as not to have to allow *
- add a filter based on tags.
- use Zod for schema validation and typing generation?

- update Mar 29: dev/live separation is now in place in a first version
    - separate dev lambda: `TasksHandlerDev`
    - separate dev DynamoDB table: `tasks-dev`
    - separate dev API Gateway
    - frontend can point to dev via `VITE_API_URL`


- update Oct 8: the email is working now (I think) when a task gets unchecked (although there is still this annoying behavior that the unchecking only happens at best exactly at the same hour as the check. (can be later if I don' go see the site since this happens only when there is a GET request))
    - I need some sort of scheduler to send the email on weekends
    - I need the unchecking to happen in real time, maybe a cron that double checks every day if any tasks need unchecking


- update Oct 9: j'ai créé une nouvelle lambda pour le unchecking, qui est invoquée par
un EventBridge Scheduler 1x par jour. Normalement ça envoie un mail à chaque fois, on verra si je reçois des mails. Si ça fonctionne, on peut je pense enlever toute la logique d'unchecking du routeur, et nettoyer un peu tout ça. Ca serait bien aussi de mutualiser le code commun s'il y en (entre les deux lambda)
