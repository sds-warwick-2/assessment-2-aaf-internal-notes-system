# CI and CD Architechture Decision Records for aaf-internal-notes-system

## Issues

Continuous integration (CI) of internal notes application.

Continuous deployment (CD) of the application to AWS cloud infrastructure.

Management of Credentials and AWS Secrets 

---

## Continuous integration (CI) of internal notes application.

### Context
The building, testing and deployment of the internal notes application needs to be automated to allow for fast inplementation of changes in the code.

### Decision
Testing, building and deployment of the application to the AWS infrastructure will be carried out using github actions with pulumi.

## Continuous deployment (CD) of the application to AWS cloud infrastructure.

### Context
The creation of AWS infrastructure needs to be flexible and easy to take down and rebuild when making changes.

### Decision
Use Pulumi to deploy and manage Infrastructure as Code

## Management of Credentials and AWS Secrets

### Context
Ensure AWS Credentials are protected to prevent unauthorised access to AWS infrastructure and the application.

### Decision
Use trufflehog to scan repository for exposed credentials.