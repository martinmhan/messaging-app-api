# messaging-app-api-typescript
TypeScript Messaging App API

Summary:
  Simple messaging app REST API I built to practice TypeScript plus a few design patterns/best practices.

Technical Stack:
  - Node.js
  - TypeScript
  - MySQL

Features:
  - REST API with layered architecture, following Domain-Driven Design principles
    - Application Layer (/controllers)
      - Controllers that interact directly with clients
      - Logic is limited to handling requests at the top level (checking authorizations, request parameters, etc.)
    - Domain Layer (/models)
      - Business objects that encapsulate and handle all domain logic
      - Contain no knowledge of clients or underlying database operations
    - Infrastructure Layer (/database)
      - Data Access Object that handles all interactions with the database
      - Logic is limited to running queries
  - Custom implementation of Active Record Pattern
    - Business objects can only be instantiated or mutated via methods that first query the database
    - Each instance represents a table row in the database
  - Stateless authentication with JSON Web Tokens
    - Implemented with Passport.js
    - Basic Access Authentication for logins
  - Database security via text encryption and hashed/salted passwords
    - Encryption algorithm uses a secret key and an initialization vector

TBD:
  - API tests
  - Socket emits
  - Docker containers
  - Task Queue
  - Cache Layer
  - Device Notifications?

Notes:
  - Users are "soft-deleted" using a unique `deletedOn` column (defaulted to 0). This allows the user table to retain history of deleted users, while still keeping the `userName` unique for active users
  - Text columns are encrypted using a static IV (instead of unique per row) since column searches, e.g., for a specific `userName`, were not doable otherwise. Open to suggestions on how to achieve both.

Resources Used:
  - https://www.typescriptlang.org/docs/
  - https://jsonapi.org/
  - https://github.com/microsoft/TypeScript-Node-Starter
