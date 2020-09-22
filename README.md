# messaging-app-api-typescript
TypeScript Messaging App API

Technical Stack:
  - Node.js
  - TypeScript
  - MySQL

Features:
  - Layered REST API architecture (pseudo-implementation of Domain-Driven Design)
    - Application Layer (src/controllers) - Controllers that interact directly with clients by handling requests
    - Domain Layer (src/models) - Business Objects that handle business logic
    - Infrastructure Layer (src/database) - Data Access Object that handles all interactions with the database
  - Custom implementation of Active Record pattern
  - Stateless session authentication via Basic access authentication and JSON Web Tokens

TBD:
  - Socket emits
  - API testing
  - Job Queue System
  - Cache Layer
  - Device Notifications

Resources Used:
  - https://github.com/microsoft/TypeScript-Node-Starter
  - https://jsonapi.org/
  - https://www.typescriptlang.org/docs/
  - https://en.wikipedia.org/wiki/Active_record_pattern
  - https://en.wikipedia.org/wiki/Basic_access_authentication
  - https://en.wikipedia.org/wiki/Data_access_object
