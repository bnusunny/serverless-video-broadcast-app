# push user votes to dynamodb

This function updates a dynamodb video entry with the user vote

## Environment variables

none

## Deployment

### Prerequisites

This function requires a dynamodb called 'Videos'

### Deployment steps

1. Run "npm install" to install dependencies
2. Run "npm run predeploy" to package the function into a zip file
3. Upload it the resulting Lambda-Deployment.zip using the AWS Lambda Console
