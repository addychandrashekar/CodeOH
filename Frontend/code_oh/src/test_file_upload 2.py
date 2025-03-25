"""
Test file to verify that file upload and content retrieval works correctly.
This file will be used to test if the content is properly stored in the database.
"""

def hello_world():
    print("Hello from CodeOH!")
    return "File content is working correctly!"

# Some test code to ensure there's enough content to verify
for i in range(5):
    print(f"Line {i + 1}: This is a test line")

class TestClass:
    def __init__(self, name):
        self.name = name
    
    def greet(self):
        return f"Hello, {self.name}!"

# Create an instance and call a method
test = TestClass("CodeOH")
greeting = test.greet()
print(greeting)