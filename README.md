# messaging-app-api-typescript
TypeScript Messaging App API

Summary:
  <Blurb about why I built this project, etc.>

Technical Stack:
  - Node.js
  - TypeScript
  - MySQL

Features:
  - REST API with layered architecture, loosely following Domain-Driven Design principles
    - Application Layer (/controllers)
      - Controllers that interact directly with clients
      - Logic is limited to handling requests at the top level (e.g., checking authorizations, request params)
    - Domain Layer (/models)
      - Business objects that encapsulate and handle all domain logic
      - Contain no knowledge of clients or underlying database operations
    - Infrastructure Layer (/database)
      - Data Access Object that handles all interactions with the database
      - Logic is limited to running queries
  - Custom implementation of Active Record Pattern
    - Business object classes can only be instantiated or mutated via methods that first query the database
    - Each instance represents an active record in the database
  - Stateless authentication
    - JSON Web Token (implemented with Passport.js)
    - Basic Access Authentication for logins
  - Database security via text encryption and hashed/salted passwords
    - Implemented with native Node.js `crypto` module
    - Encryption algorithm uses both a secret key and a random IV (initialization vector) unique to each row

TBD:
  - Socket emits
  - API testing
  - Job Queue System
  - Cache Layer
  - Device Notifications
  - Docker containers

Other Notes:
  - Users are "soft-deleted" using a `deletedOn` column (defaulted to 0). This allows the user table to retain history of deleted users, while keeping the `userName` for active users unique
  - <why I didnt use an ORM>

Resources Used:
  - https://github.com/microsoft/TypeScript-Node-Starter
  - https://jsonapi.org/
  - https://www.typescriptlang.org/docs/
  - https://en.wikipedia.org/wiki/Active_record_pattern
  - https://en.wikipedia.org/wiki/Basic_access_authentication
  - https://en.wikipedia.org/wiki/Data_access_object
