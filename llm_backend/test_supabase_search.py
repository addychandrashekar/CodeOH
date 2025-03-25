from database import query_supabase_for_embeddings
from embedding import generate_embedding

#testing query
test_query = "Find authentication function"

#generate the actual embedding
query_embedding = generate_embedding(test_query)

print("Query embedding type:", type(query_embedding))
print("First 5 values:", query_embedding)
print("Query embedding length:", len(query_embedding))

#get the relevant snippets
results = query_supabase_for_embeddings(query_embedding, match_threshold=0.5)

#print out the results
print("Supabase search results:", results)