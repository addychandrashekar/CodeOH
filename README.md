This is a FastAPI-based backend service for managing users, projects, and files. The project is connected to a PostgreSQL database and supports CRUD operations.

## Features

🔹 User Management: Create, retrieve, and delete users with hashed passwords.

🔹 Project Management: Associate projects with users and manage them.

🔹 File Upload: Upload files linked to projects.

🔹 Database Connection Check: Verify the connection to the database.

# Endpoints

## Root Endpoint

```bash
GET / - Welcome message endpoint
```

## User Management

Regular User Operations

```bash
GET /users - Get all users
```

```bash
GET /users/{user_id} - Get a specific user
```

```bash
POST /users - Create a new user
```

```bash
DELETE /users/{user_id} - Delete a user
```

Authentication

```bash
POST /register - Register a new user
```

```bash
POST /login - Login user (returns JWT token)
```

```bash
POST /api/auth/user - Handle Kinde authentication
```

## Project Management

```bash
GET /projects - Get all projects
```

```bash
POST /projects - Create a new project
```

```bash
DELETE /projects/{project_id} - Delete a project
```

## File Management

File Operations

```bash
GET /api/files - Get user's files (requires userId query parameter)
```

```bash
GET /api/files/{file_id}/content - Get content of a specific file
```

```bash
DELETE /api/files/{file_id} - Delete a specific file
```

```bash
POST /api/files/upload - Upload files and folders
```

```bash
POST /files - Upload a single file
```

## Database Health Check

```bash
GET /db-check - Check database connection status
```

# Setup Instructions

1. Run the following command to install required Python packages:
   pip install --user fastapi uvicorn sqlalchemy bcrypt psycopg2 pydantic

Note: Ensure that `pip` is correctly pointing to Python 3 before running the installation command. If unsure, use:
python3 -m pip install --user fastapi uvicorn sqlalchemy bcrypt psycopg2 pydantic

2. To run the FastAPI server:
   uvicorn main:app --reload

Note: Ensure that `pip` is correctly pointing to Python 3 before running the installation command. If unsure, use:
python3 -m uvicorn main:app --reload

4. Then, open http://127.0.0.1:8000/docs to test APIs using Swagger UI.

5. Database Connection
   Ensure your PostgreSQL database is properly configured in database.py before running the server.

## API Endpoints

Here are the available API endpoints:

![API Endpoints](description.png)

For Delete
After run the FastAPI, and use 'curl -X 'GET' 'http://127.0.0.1:8000/users' ' to get all user info.

Then use 'curl -X 'DELETE' 'http://127.0.0.1:8000/users/47653704-ac88-4666-b17b-15ac004953a6' '.
(47653704-ac88-4666-b17b-15ac004953a6) is sample user id.

If delete successful, it return "{"message": "User deleted"}"

## Example demo

Here is the demo of checking users variable in Supabase
![Example demo](Supabase.png)

Here is the demo of http://127.0.0.1:8000/docs
![Example demo](docs.png)

Here is the demo of http://127.0.0.1:8000
![Example demo](8000.png)

Here is the demo of http://127.0.0.1:8000/users
![Example demo](users.png)
