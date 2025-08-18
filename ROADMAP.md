- needs a dev db and a proper dev flow: it should be able to run in prod or dev mode, and not on the same db
- needs to be more pretty
- needs some sort of contract between back and front. I did add an OpenAPI thing but am not sure how it works. We need schema validation on the lambda side, too. Look at Request Validator in API Gateway, for every method's method request section. Maybe that's a good lead.
- needs something more robust for CORS, so as not to have to allow *

- add Tags (voiture, maison, vélos, etc.) and a filter.


ATTENTION: si on veut modifier le schema il faut d'abord merger avec celui de l'api gateway sinon on perd le DELETE (quoique peut être en choisissant "merge" au lieu de "override" ça marcherait ? peut être à tester mais il faut bien regarder comment est fichu le delete avant pour le refaire si besoin)



for next time: j'ai modifié un peu le openapi (tag -> tags) pour fixer des erreurs TS et n'ai pas encore reporté ça dans la API Gateway 😬 TODO...