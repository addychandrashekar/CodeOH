import google.generativeai as genai
from database import store_embedding_in_supabase
from embedding import generate_embedding

#creating all of the snippets of code
code_snippets = [
    ("auth.py", '''
def authenticate_user(username, password):
    if username == "admin" and password == "password123":
        return True
    return False
    '''),

    ("auth.py", '''
def login_user(username, password):
    if verify_user(username, password):
        return "Login successful"
    return "Invalid credentials"
    '''),

    ("auth.py", '''
def validate_token(token):
    if token == "valid_token":
        return True
    return False
    '''),

    ("utils.py", '''
def format_date(date):
    return date.strftime('%Y-%m-%d')
    '''),

    ("utils.py", '''
def send_email(to_email, subject, body):
    # Send email logic here
    return f"Email sent to {to_email} with subject {subject}"
    '''),

    ("database.py", '''
def connect_to_db():
    return "Connected to the database successfully"
    '''),

    ("database.py", '''
def get_user_by_id(user_id):
    # Logic to get user from DB by ID
    return f"User with ID {user_id} found"
    ''')
]

#store each file in supabase with its embedding
for file_name, code_snippet in code_snippets:
    embedding = generate_embedding(code_snippet)
    store_embedding_in_supabase(file_name, code_snippet, embedding)

print("All code snippets inserted successfully!")