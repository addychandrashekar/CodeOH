from embedding import generate_embedding
from database import store_embedding_in_supabase

# # Your user ID
# my_user_id = "kp_e339f0c10e5a4cd6a1458541ea08d361"

# # Fake user IDs for testing
# other_user_ids = [
#     "user_abc123",
#     "user_def456",
#     "user_xyz789"
# ]

# # Each tuple: (file_name, code_snippet, assigned_user_id)
# code_snippets = [
#     # Belongs to YOU — relevant auth
#     ("auth.py", '''
# def authenticate_user(username, password):
#     if username == "admin" and password == "password123":
#         return True
#     return False
#     ''', my_user_id),

#     # Belongs to YOU — not auth
#     ("utils.py", '''
# def send_email(to_email, subject, body):
#     # Send email logic here
#     return f"Email sent to {to_email} with subject {subject}"
#     ''', my_user_id),

#     # Belongs to YOU — relevant auth
#     ("auth.py", '''
# def validate_token(token):
#     if token == "valid_token":
#         return True
#     return False
#     ''', my_user_id),

#     # Someone else — auth code
#     ("auth.py", '''
# def login_user(username, password):
#     if verify_user(username, password):
#         return "Login successful"
#     return "Invalid credentials"
#     ''', other_user_ids[0]),

#     # Someone else — db code
#     ("database.py", '''
# def connect_to_db():
#     return "Connected to the database successfully"
#     ''', other_user_ids[1]),

#     # Someone else — util code
#     ("utils.py", '''
# def format_date(date):
#     return date.strftime('%Y-%m-%d')
#     ''', other_user_ids[2]),

#     # Someone else — db user logic
#     ("database.py", '''
# def get_user_by_id(user_id):
#     # Logic to get user from DB by ID
#     return f"User with ID {user_id} found"
#     ''', other_user_ids[0]),
# ]

# # Store in Supabase
# for file_name, code_snippet, user_id in code_snippets:
#     embedding = generate_embedding(code_snippet)
#     store_embedding_in_supabase(user_id, file_name, code_snippet, embedding)

# print("All test code snippets inserted with mixed user_ids!")

file_name = "xyzblarg.py"
code_snippet = '''
def check_credentials(user_input, secret):
    return user_input == secret
'''
user_id = "kp_e339f0c10e5a4cd6a1458541ea08d361"

embedding = generate_embedding(code_snippet)
store_embedding_in_supabase(user_id, file_name, code_snippet, embedding)

print("Inserted test credential checker!")