The idea behinde the 3 lambdas is:
- One to handle the http requests
- One to uncheck elapsed tasks every day (WIP: not working well yet, and a lot of this logic is still duplicated in the http lambda)
- One to send a weekly digest (there is a draft in the repo but nothing in AWS as of March 29)