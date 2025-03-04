from embedding import generate_embedding

test_query = "How does authentication work?"
embedding = generate_embedding(test_query)

print("Generated embedding:", embedding)
print("Embedding length:", len(embedding))