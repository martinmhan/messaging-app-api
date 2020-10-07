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
  - Set up MySQL database tables (run /src/database/upgrade.sh)
  - Install dependencies (`yarn` from project directory)
  - Run JavaScript build (`yarn build`)
  - Start server (`yarn start`)

### Features:
  - REST API with layered architecture, following Domain-Driven Design and OOP principles
    - Application Layer (`/api`)
      - Logic is limited to handling client requests (e.g., checking authorizations, request parameters)
      - Custom wrapper classes used to standardize request/response rules and organize socket event logic
    - Domain Layer (`/models`)
      - Business object classes that encapsulate all domain logic
      - Contain no knowledge of clients or underlying database operations
    - Infrastructure Layer (`/database`)
      - Data Access Object (DAO) singleton class that handles all database interactions
      - Logic is limited to running queries
  - Stateless authentication via JSON Web Tokens (for both API requests and socket connections)
    - JWTs obtained via Basic Access Authentication login
  - Custom implementation of Active Record Pattern
    - Each instance reflects a current table row in the database
    - Business objects can only be instantiated or mutated via methods that first query the database
  - Tests
    - Functional and unit tests for API, web socket, and domain objects(90%+ coverage)
    - Option to mock the database for faster tests
  - Database
    - Encrypted text fields and hashed/salted passwords
    - Ordered, idempotent SQL scripts to upgrade to the latest database
  - Code linting with pre-commit hooks via ESLint/Prettier
  - Automated Tests via CircleCI

### Notes:
  - The `BaseController` and `RouterContainer` classes (along with /types/types.ts) were built to strictly enforce specific protocols in handling requests/responses (as opposed to using stray request handler functions passed into an `Express.Router` instance). Namely, the response body must follow the `JSONResponse` interface, and error messages/status codes are pre-defined.
  - Certain socket tests were difficult to test since they relied on the socket client NOT receiving an event from the socket server. For these, I nested a failing test inside the expected-to-not-happen socket event and used a `setTimeout(done, 1000)` (i.e., wait 1s for it to occur, then pass), but I'm sure there is a better way to do this..
  - Users are "soft-deleted" using a unique `deletedOn` column (defaulted to 0). This allows the user table to retain history of deleted users, while still keeping the `userName` unique for active users
  - Text columns are encrypted using a static IV since column searches (e.g., for a specific `userName`) were not easily doable with one unique per row. Open to suggestions how one might achieve both

### Resources:
  - https://www.typescriptlang.org/docs/
  - https://jestjs.io/docs/en/getting-started
  - https://socket.io/docs/
  - https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
  - https://github.com/microsoft/TypeScript-Node-Starter
  - https://jsonapi.org/
