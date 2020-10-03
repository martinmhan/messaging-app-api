# Node/TypeScript Messaging App API

### Summary:
  Simple messaging app REST API I built to learn TypeScript and implement some best practice design patterns

### Technical Stack:
  - Node.js
  - TypeScript
  - MySQL

### Prerequisites:
  - Install Node.js (https://nodejs.org/en/)
  - Install MySQL (`brew install mysql` via Homebrew)
  - Install yarn (https://classic.yarnpkg.com/en/docs/install/#mac-stable)
  - Install TypeScript (`npm install -g typescript` via NPM)

### Setup:
  - Clone the repository (`git clone https://www.github.com/martinmhan/messaging-app-api-typescript`)
  - Set up MySQL database tables (run /src/database/upgrade.sh)
  - Install dependencies (`yarn` from project directory)
  - Run JavaScript build (`yarn build`)
  - Start server (`yarn start`)

### Features:
  - REST API with layered architecture, following Domain-Driven Design principles
    - Application Layer (`/controllers`)
      - Controllers that interact directly with clients
      - Logic is limited to handling requests at the top level (e.g., checking authorizations, request parameters)
    - Domain Layer (`/models`)
      - Business object classes that encapsulate all domain logic
      - Contain no knowledge of clients or underlying database operations
    - Infrastructure Layer (`/database`)
      - Data Access Object (DAO) singleton class that handles all database interactions
      - Logic is limited to running queries
  - Custom implementation of Active Record Pattern
    - Business objects can only be instantiated or mutated via methods that first query the database
    - Each instance represents a table row in the database
  - Stateless authentication via JSON Web Tokens (for both API requests and socket connections)
    - JWTs obtained via Basic Access Authentication login
  - Database security via text encryption and hashed/salted passwords
    - Encryption algorithm uses both a secret key and an initialization vector
  - Tests
    - Functional and unit tests for API and web socket built via Jest (85%+ coverage)
    - Option to mock the database using a mock DAO that saves/reads records in memory
  - Code linting
    - ESLint and Prettier checks with pre-commit hooks

### TBD
  - Message queue (RabbitMQ?)
  - Load testing
  - Refactor to IOC architecture
  - Accompanying mobile client (iOS Swift?)

### Notes:
  - Users are "soft-deleted" using a unique `deletedOn` column (defaulted to 0). This allows the user table to retain history of deleted users, while still keeping the `userName` unique for active users
  - Text columns are encrypted using a static IV since column searches (e.g., for a specific `userName`) were not easily doable with one unique per row. Open to suggestions how one might achieve both

### Resources:
  - https://www.typescriptlang.org/docs/
  - https://jestjs.io/docs/en/getting-started
  - https://socket.io/docs/
  - https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
  - https://github.com/microsoft/TypeScript-Node-Starter
  - https://jsonapi.org/
