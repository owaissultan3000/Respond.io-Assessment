# Note Taking API

A RESTful API for managing notes with version control, concurrency handling, and full-text search capabilities.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Note Management**: Create, read, update, and delete notes
- **Version Control**: Track all changes to notes and revert to previous versions
- **Concurrency Control**: Optimistic locking prevents conflicting updates
- **Full-Text Search**: Fast search using MySQL full-text indexing
- **Redis Caching**: Improved performance for frequently accessed data
- **Soft Deletes**: Notes are marked as deleted but preserved in database
- **Refresh Tokens**: Long-lived sessions with token refresh mechanism

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL 8.0 with Sequelize ORM
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/owaissultan3000/Respond.io-Assessment.git
cd Respond.io-Assessment
```

### 2. Environment Setup

The project includes example environment variables file `env.example`. Create a copy by executing following command:
```env
cp .env.example .env
```

### 3. Start the Application
```bash
# Build and start all services
docker-compose up --build
```


The API will be available at `http://localhost:3000`

### 4. Verify Setup
```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development"
}
```

## API Documentation

### Base URL
```
http://localhost:3000/
```

### Authentication Endpoints

#### Register a New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3d4..."
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: Same as register
```

#### Refresh Access Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4..."
}

Response:
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3d4..."
  }
}
```

### Note Endpoints

All note endpoints require authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access-token>
```

#### Create a Note
```bash
POST /api/notes
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "title": "My First Note",
  "content": "This is the content of my note"
}

Response:
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "id": 1,
    "title": "My First Note",
    "content": "This is the content of my note",
    "userId": 1,
    "version": 1,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

#### Get All Notes
```bash
GET /api/notes?page=1&limit=10
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": {
    "notes": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

#### Get Single Note
```bash
GET /api/notes/:id
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Note retrieved successfully",
  "data": {
    "id": 1,
    "title": "My First Note",
    "content": "This is the content",
    "version": 2,
    ...
  }
}
```

#### Update a Note
**Important**: You must provide the current version number to prevent concurrent update conflicts.
```bash
PUT /api/notes/:id
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "title": "Updated Title",
  "content": "Updated content",
  "version": 1
}

Response (Success):
{
  "success": true,
  "message": "Note updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Title",
    "content": "Updated content",
    "version": 2,
    ...
  }
}

Response (Conflict):
{
  "success": false,
  "message": "Conflict: Note has been modified by another user. Please refresh and try again.",
  "currentVersion": 2,
  "providedVersion": 1
}
```

#### Delete a Note
```bash
DELETE /api/notes/:id
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Note deleted successfully"
}
```

#### Search Notes
```bash
GET /api/notes/search?keyword=javascript
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Search completed",
  "data": {
    "keyword": "javascript",
    "count": 5,
    "notes": [...]
  }
}
```

#### Get Note Version History
```bash
GET /api/notes/:id/versions
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Versions retrieved successfully",
  "data": {
    "noteId": "1",
    "count": 3,
    "versions": [
      {
        "id": 3,
        "noteId": 1,
        "title": "Latest Title",
        "content": "Latest content",
        "versionNumber": 3,
        "createdAt": "2024-01-20T12:00:00.000Z"
      },
      {
        "id": 2,
        "versionNumber": 2,
        ...
      },
      {
        "id": 1,
        "versionNumber": 1,
        ...
      }
    ]
  }
}
```

#### Revert to Previous Version
```bash

POST /api/notes/revert
Content-Type: application/json
Authorization: Bearer <accessToken>

# Example: Revert note 3 to version 1

{
    "noteId": 3,
    "revertVersion": 1
}

Response:
{
  "success": true,
  "message": "Note reverted to version 1",
  "data": {
    "id": 1,
    "title": "Title from version 1",
    "content": "Content from version 1",
    "version": 3,  // New version created
    ...
  }
}
```

## Testing the Application

### Using cURL

1. **Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123"}'
```

2. **Save the tokens from the response**

3. **Create a note:**
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title":"Test Note","content":"This is a test note"}'
```

4. **Update the note:**
```bash
curl -X PUT http://localhost:3000/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title":"Updated Note","content":"Updated content","version":1}'
```

5. **View version history:**
```bash
curl -X GET http://localhost:3000/api/notes/1/versions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the provided Postman collection
2. Set environment variable `baseUrl` to `http://localhost:3000`
3. Login/Register will automatically save the `accessToken`
4. All subsequent requests will use the saved token

### Testing Concurrency Control

Open two terminal windows or two seperate requests in postman:

**Terminal 1:**
```bash
# Get the note (note the version number)
curl -X GET http://localhost:3000/api/notes/1 \
  -H "Authorization: Bearer TOKEN"

# Update with version 1
curl -X PUT http://localhost:3000/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Update 1","content":"First update","version":1}'
```

**Terminal 2 (immediately after):**
```bash
# Try to update with old version 1
curl -X PUT http://localhost:3000/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Update 2","content":"Second update","version":1}'

# This should fail with conflict error
```

## Project Structure
```
.
├── src/
│   ├── config/          # Database, Redis, Environment config
│   ├── models/          # Sequelize models
│   ├── controllers/     # Request handlers
│   ├── routes/          # Route definitions
│   ├── middlewares/     # Auth, validation, caching
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── docker-compose.yml   # Docker services configuration
├── Dockerfile           # Node Backend
├── package.json
├── tsconfig.json
└── README.md
```

## Performance Tips

- Redis caching is enabled for read operations
- Full-text search is optimized with MySQL indexes
- Use pagination for large result sets
- Monitor cache hit rates in logs


## Support

For issues and questions, please open an issue in the repository.
