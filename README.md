# Tasks app

TS + React + Vite + AWS (Lambdas, DynamoDB)

## Some useful commands

```bash
npm run dev # local server
npm run test # unit tests
npm run generate:types # generate TS typings (in shared folder) based on API spec (openapi.yaml)
npm run push:lambda # build and deploy the live lambda
npm run push:lambda-dev # build and deploy the dev lambda
npm run push:lambda:digest # build and deploy the weekly digest lambda
```

## Some useful documentation

See [AWS.md](./AWS.md) for info about the AWS config  
See [Roadmap.md](./ROADMAP.md) for info about the next dev steps for this project
