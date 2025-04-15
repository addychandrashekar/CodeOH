# CodeOH - Your AI-Powered Coding Assistant

This is a FastAPI-based backend service and React frontend application for enhancing your coding experience with AI assistance. The system helps with generating code, fixing errors, optimizing solutions, and more.

## Features

🔹 **AI Code Generation:** Create and modify code with natural language prompts

🔹 **Project Management:** Organize and manage your coding projects

🔹 **File Management:** Create, modify, and organize your code files

🔹 **Error Fixing:** Automatic error detection and fixing suggestions

🔹 **Test Generation:** Auto-generate test cases for your functions

🔹 **Code Optimization:** Get suggestions for improving your code performance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+ with pip
- PostgreSQL database

### Installation

1. **Clone the repository**

   ```
   git clone https://github.com/yourusername/codeoh.git
   cd codeoh
   ```

2. **Backend Setup**

   ```bash
   # Install required Python packages
   pip install --user fastapi uvicorn sqlalchemy bcrypt psycopg2 pydantic python-multipart

   # Start the FastAPI server
   cd Backend
   uvicorn main:app --reload
   ```

3. **Frontend Setup**

   ```bash
   # Install dependencies
   cd Frontend/code_oh
   npm install

   # Start the development server
   npm run dev
   ```

4. **Database Configuration**
   Ensure your PostgreSQL database is properly configured in `Backend/database.py` before running the server.

5. **Access the Application**
   Open http://localhost:3000 in your browser to access the CodeOH application.

## AI Assistant Capabilities

CodeOH features a powerful AI assistant that can help with various coding tasks. Here's what you can do:

### Creating Files

Create new code files using natural language:

```
Create a new file called sentiment_analysis.py that performs sentiment analysis on text
```

```
Create a file named data_processor.js that can parse CSV and JSON data
```

### Modifying Existing Files

Request changes to your existing code:

```
Add error handling to the process_data function in data_processor.js
```

```
Refactor the calculate_statistics function to improve readability
```

### Test Case Generation

Generate comprehensive test cases for your functions:

```
Generate tests for the calculate_median function
```

```
Create test cases that cover edge cases for the binary_search algorithm
```

### Error Fixing

Automatically detect and fix errors in your code:

```
Fix the TypeError in calculate_mean.py
```

You can also use the "Fix Issue" button that appears when errors are detected in the console output.

### Code Optimization

Get suggestions for improving performance:

```
Optimize the sorting algorithm in sort.py
```

```
Make the database queries more efficient in the user service
```

### Code Generation

Generate complete code solutions:

```
Write a function that calculates the Fibonacci sequence iteratively
```

```
Create a React component for a responsive navigation bar
```

### Code Explanation

Get detailed explanations of how code works:

```
Explain how the quick_sort algorithm works
```

```
Describe what this regex pattern does: ^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$
```

### Searching the Codebase

Find specific code or patterns across your project:

```
Find all functions that use the database connection
```

```
Search for implementations of the Observer pattern in the codebase
```

### Documentation Generation

Create documentation for your code:

```
Generate documentation for the UserService class
```

```
Create JSDoc comments for the API client functions
```

### Code Translation

Translate code between different programming languages:

```
Convert this Python function to JavaScript
```

```
Translate this Java class to TypeScript
```

### Learning Resources

Get explanations and learning materials:

```
Explain how closures work in JavaScript
```

```
Show me an example of using async/await with error handling
```

### Advanced IDE Features

- **Rate Limiting Management:** The system intelligently manages API requests to prevent rate limiting issues
- **Response Caching:** Frequently requested operations are cached for improved performance
- **Fix Application Button:** One-click solution to apply suggested fixes to your code
- **Smart Code Replacement:** Accurately replaces only the affected functions when applying fixes

## Walkthrough Video

For a comprehensive demonstration of CodeOH's features and capabilities, watch our walkthrough video:

### Screen Recording

![CodeOH Demo Video](https://github.com/user/CodeOH/assets/12345678/abcdef12-3456-7890-abcd-ef1234567890)

_Note: To add your own screen recording:_

1. Create an issue in your repository
2. Drag and drop your video file into the issue description
3. Copy the generated URL (in format like the placeholder above)
4. Replace the URL above with your actual video URL
5. Make sure to keep the Markdown image format: `![CodeOH Demo Video](your-video-url-here)`

Alternatively, for YouTube videos use:

```html
<div align="center">
  <a href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID">
    <img
      src="https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg"
      alt="CodeOH Demo"
      width="600"
    />
  </a>
  <p>Click to watch the demo video</p>
</div>
```

The video covers:

- Setting up your first project
- Creating and modifying files
- Using the AI assistant for code generation
- Fixing errors and optimizing code
- Generating test cases
- Advanced features and tips

## Endpoints

### Backend API

#### Root Endpoint

```bash
GET / - Welcome message endpoint
```

#### User Management

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

#### Project Management

```bash
GET /projects - Get all projects
```

```bash
POST /projects - Create a new project
```

```bash
DELETE /projects/{project_id} - Delete a project
```

#### File Management

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

#### Database Health Check

```bash
GET /db-check - Check database connection status
```

## Performance Optimizations

CodeOH includes several performance optimizations:

- **Response Caching:** Common AI responses are cached to improve response times
- **Request Deduplication:** Prevents duplicate API calls for the same request
- **Parallel Processing:** Handles multiple operations concurrently when possible
- **Optimized File Parsing:** Efficiently processes large codebases
- **Lazy Loading:** Components and resources are loaded only when needed

## Contributing

We welcome contributions to CodeOH! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped with the development
- Special thanks to the FastAPI, React, and AI communities for their invaluable resources
