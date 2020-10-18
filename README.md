# Node/TypeScript Messaging App API

### Summary:
  A messaging app REST API I built to learn TypeScript and implement some design patterns and best practices. Focus here was on code quality and design, not so much building a working chat app.

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
  - Create a `.env` file following the `.env.example`
  - Set up MySQL database tables (in the terminal, navigate to src/database and run `upgrade.sh`)
  - Install dependencies (`yarn` from project directory)
  - Run JavaScript build (`yarn build`)
  - Start server (`yarn start`)

### Features:
  - REST API with layered architecture, following [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design) and OOP principles
    - Application Layer (`/api`)
      - Logic is limited to handling client requests (e.g., checking authorizations, request parameters)
      - Custom wrapper classes used to enforce standard request/response rules, organize controllers, and encapsulate socket server logic
    - Domain Layer (`/models`)
      - Business object classes that encapsulate domain logic
      - Contain no knowledge of clients or underlying database operations
    - Infrastructure Layer (`/database`)
      - Data Access Object interface implemented with MySQL serving as gateway for all database interactions used by domain layer models
      - Logic is limited to running queries
  - Stateless authentication via JSON Web Tokens (for both API requests and socket connections)
    - JWTs obtained via Basic Access Authentication login
  - Custom implementation of [Active Record Pattern](https://en.wikipedia.org/wiki/Active_record_pattern)
    - Business objects (`User`, `Conversation`, and `Message`) can only be instantiated or mutated via methods that first query the database
  - Tests
    - Functional and unit tests for API, web socket, and domain objects (90%+ coverage)
    - Option to mock the database for faster tests
  - Database
    - Encrypted text fields and hashed/salted passwords
    - Scripts set up to easily upgrade to the latest database version

### Resources:
  - https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
  - https://jsonapi.org/
