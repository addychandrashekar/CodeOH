This is a FastAPI-based backend service for managing users, projects, and files. The project is connected to a PostgreSQL database and supports CRUD operations.

Features
🔹 User Management: Create, retrieve, and delete users with hashed passwords.
🔹 Project Management: Associate projects with users and manage them.
🔹 File Upload: Upload files linked to projects.
🔹 Database Connection Check: Verify the connection to the database.



Setup Instructions
1. Run the following command to install required Python packages:
python3 -m pip install --user fastapi uvicorn sqlalchemy bcrypt psycopg2 pydantic

2. To run the FastAPI server:
python3 -m uvicorn main:app --reload

3. Then, open http://127.0.0.1:8000/docs to test APIs using Swagger UI.

4. Database Connection
Ensure your PostgreSQL database is properly configured in database.py before running the server.


## API Endpoints

Here are the available API endpoints:

![API Endpoints](fastapi/description.png)