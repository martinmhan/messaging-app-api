# messaging-app-api-typescript
TypeScript Messaging App API

Summary:
  Simple messaging app REST API I built to learn TypeScript and implement some design patterns/best practices

Technical Stack:
  - Node.js
  - TypeScript
  - MySQL

Pre-requisites:
  - Install Node.js (https://nodejs.org/en/)
  - Install MySQL (`brew install mysql` with Homebrew)
  - Install yarn (https://classic.yarnpkg.com/en/docs/install/#mac-stable)
  - Install TypeScript (`npm install -g typescript`)

Setup:
  - Clone the repository (`git clone https://www.github.com/martinmhan/messaging-app-api-typescript`)
  - Install dependencies (`yarn` from project directory)
  - Set up MySQL database tables (run /src/database/upgrade.sh)
  - Run JavaScript build (`yarn build`)
  - Start server (`yarn start`)

Features:
  - REST API with layered architecture, following Domain-Driven Design principles
    - Application Layer (/controllers)
      - Controllers that interact directly with clients
      - Logic is limited to handling requests at the top level (e.g., checking authorizations, request parameters)
    - Domain Layer (/models)
      - Business objects that encapsulate and handle all domain logic
      - Contain no knowledge of clients or underlying database operations
    - Infrastructure Layer (/database)
      - Data Access Object singleton class that handles all database interactions
      - Logic is limited to running queries
  - Custom implementation of Active Record Pattern
    - Business objects can only be instantiated or mutated via methods that first query the database
    - Each instance represents a table row in the database
  - Stateless authentication via JSON Web Tokens
    - Basic Access Authentication for logins
  - Database security via text encryption and hashed/salted passwords
    - Encryption algorithm uses both a secret key and an initialization vector
  - Tests
    - API and unit tests built using jest
    - Option to mock the database using a mock DAO (/src/database/__mocks__) that saves/reads records in memory
  - Code linting
    - ESLint and Prettier checks with pre-commit hooks

TBD:
  - Socket emits
  - Task Queue
  - Docker containers
  - Device Notifications

Notes:
  - Users are "soft-deleted" using a unique `deletedOn` column (defaulted to 0). This allows the user table to retain history of deleted users, while still keeping the `userName` unique for active users
  - Text columns are encrypted using a static IV since column searches (e.g., for a specific `userName`) were not easily doable with one unique per row. Open to suggestions how one might achieve both

Resources Used:
  - https://www.typescriptlang.org/docs/
  - https://github.com/microsoft/TypeScript-Node-Starter
  - https://jsonapi.org/
