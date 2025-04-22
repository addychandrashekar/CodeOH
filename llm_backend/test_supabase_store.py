from embedding import generate_embedding
from database import store_embedding_in_supabase

file_name = "xyzblarg.py"
code_snippet = '''
def check_credentials(user_input, secret):
    return user_input == secret
'''
user_id = "kp_e339f0c10e5a4cd6a1458541ea08d361"

embedding = generate_embedding(code_snippet)
store_embedding_in_supabase(user_id, file_name, code_snippet, embedding)

print("Inserted test credential checker!")