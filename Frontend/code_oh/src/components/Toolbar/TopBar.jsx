import { Box, Code, HStack, IconButton, useColorMode, Image, Spacer, Button, useToast } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'
import { useFiles } from '../../context/FileContext'
import { BACKEND_API_URL } from '../../services/BackendServices'
import { useState } from 'react'
import axios from 'axios'
import { useKindeAuth } from "@kinde-oss/kinde-auth-react"


/**
 * TopBar component that provides the main toolbar interface for the application.
 * Contains the application title, code execution button, and AI assistant toggle.
 * Integrates with EditorContext for code execution and theme management.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.toggleLLM - Function to toggle the AI assistant panel
 * @param {boolean} props.isLLMOpen - Current state of the AI assistant panel
 * @returns {JSX.Element} A toolbar with application controls
 */
export const TopBar = ({ toggleLLM, isLLMOpen }) => {
    // Theme and editor context hooks
    const { colorMode } = useColorMode()
    const { runCode, isLoading } = useEditor()
    const { activeFile, setActiveFile } = useFiles()
    const [isGeneratingTests, setIsGeneratingTests] = useState(false)
    const toast = useToast()
    const { user } = useKindeAuth()
    
    // Function to generate test cases for the active file
    const generateTestCases = async () => {
        if (!activeFile || !user?.id) return
        
        try {
            setIsGeneratingTests(true)
            
            // Prepare the prompt for generating test cases
            const fileType = activeFile.fileType || 'py';
            let testHeader = '# Test Cases';
            
            // Determine appropriate test header based on file type
            if (fileType === 'js' || fileType === 'jsx' || fileType === 'ts' || fileType === 'tsx') {
                testHeader = '// Test Cases';
            } else if (fileType === 'java' || fileType === 'c' || fileType === 'cpp') {
                testHeader = '// Test Cases';
            }
            
            const prompt = `
Generate simple test cases for the following ${fileType} file:
\`\`\`
${activeFile.content}
\`\`\`

Important: DO NOT use any testing libraries or frameworks. Instead:
1. Create simple test functions that directly call the original functions with sample inputs
2. Compare the actual output with expected output using simple equality checks
3. Print or log success/failure messages for EACH test
4. Add a main function that runs all tests

For example, in Python:
\`\`\`python
# Simple test for add function
def test_add():
    print("Testing add function...")
    
    # Test case 1
    result = add(2, 3)
    expected = 5
    print(f"Test add(2, 3): {'PASS' if result == expected else 'FAIL'}, Got: {result}, Expected: {expected}")
    
    # Test case 2
    result = add(-1, 1)
    expected = 0
    print(f"Test add(-1, 1): {'PASS' if result == expected else 'FAIL'}, Got: {result}, Expected: {expected}")

# Run all tests
def run_tests():
    print("======= RUNNING TESTS =======")
    test_add()
    print("======= TESTS COMPLETE =======")

# Execute tests when this file runs
if __name__ == "__main__" or True:  # The 'or True' ensures tests run when code is executed
    run_tests()
\`\`\`

For JavaScript, use console.log() for output.
For other languages, use appropriate print/output functions.

Include multiple test cases for each function with different inputs, including edge cases.
Ensure tests will print their result when file is executed.
Return only the test code without explanations outside the code.
`;
            
            // Call the backend API to generate test cases
            const response = await axios.post(`${BACKEND_API_URL}/chat`, {
                user_message: prompt,
                user_id: user.id
            });
            
            const generatedTests = response.data.response.text || response.data.response;
            
            // Extract code from markdown if necessary
            let testCode = generatedTests;
            const codeBlockMatch = generatedTests.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                testCode = codeBlockMatch[1];
            }
            
            // Check if the generated test code includes a main function or run_tests function
            const hasMainFunction = testCode.includes('if __name__ == "__main__"') || 
                                   testCode.includes("if __name__ == '__main__'") ||
                                   testCode.includes('function main()') ||
                                   testCode.includes('def run_tests()');
                                   
            // Extract test function names using regex
            const testFunctionRegex = /def\s+(test_\w+)\s*\(/g;
            const testFunctions = [];
            let match;
            while ((match = testFunctionRegex.exec(testCode)) !== null) {
                testFunctions.push(match[1]);
            }
            
            // If no main function and we have test functions, append one
            if (!hasMainFunction && testFunctions.length > 0) {
                if (fileType === 'py') {
                    testCode += `\n\n# Run all tests
def run_tests():
    print("======= RUNNING TESTS =======")
${testFunctions.map(func => `    ${func}()`).join('\n')}
    print("======= TESTS COMPLETE =======")

# Execute tests when this file runs
if __name__ == "__main__" or True:  # The 'or True' ensures tests run when code is executed
    run_tests()
`;
                } else if (fileType === 'js' || fileType === 'jsx' || fileType === 'ts' || fileType === 'tsx') {
                    testCode += `\n\n// Run all tests
function runAllTests() {
    console.log("======= RUNNING TESTS =======");
${testFunctions.map(func => `    ${func}();`).join('\n')}
    console.log("======= TESTS COMPLETE =======");
}

// Execute tests
runAllTests();
`;
                } else if (fileType === 'java') {
                    testCode += `\n\n// Main method to run all tests
public static void main(String[] args) {
    System.out.println("======= RUNNING TESTS =======");
${testFunctions.map(func => `    ${func}();`).join('\n')}
    System.out.println("======= TESTS COMPLETE =======");
}
`;
                }
            }
            
            // Append the test code to the existing file content with appropriate header
            const updatedContent = `${activeFile.content}\n\n${testHeader}\n${testCode}`;
            
            // Update the file in the backend
            const updateResponse = await fetch(
                `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${user.id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: updatedContent
                    }),
                }
            )
            
            if (updateResponse.ok) {
                // Update the active file in the state
                setActiveFile({
                    ...activeFile,
                    content: updatedContent
                })
                
                toast({
                    title: "Test cases generated",
                    description: "Test cases have been added to the file",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                })
            } else {
                throw new Error("Failed to update the file")
            }
        } catch (error) {
            console.error("Error generating test cases:", error)
            toast({
                title: "Error",
                description: "Failed to generate test cases",
                status: "error",
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setIsGeneratingTests(false)
        }
    }
    
    return (
        <Box 
            gridArea='top'
            bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
            h="40px"
            display="flex"
            alignItems="center"
            px={4}
        >
            <HStack spacing={4} width="100%">
                {/* Application title */}
                <Code fontSize="md">Code-OH</Code>
                <Spacer />

                {/* Test Case button - only visible when a file is open */}
                {activeFile && (
                    <Button
                        size="xs"
                        colorScheme="teal"
                        onClick={generateTestCases}
                        isLoading={isGeneratingTests}
                        loadingText="Generating..."
                        mr={2}
                    >
                        Test Case
                    </Button>
                )}

                {/* Code execution button */}
                <IconButton
                    icon={
                        <span 
                            className="material-symbols-outlined"
                            style={{ 
                                fontSize: '28px',
                                color: colorMode === 'dark' ? 'white' : 'black',
                                fontVariationSettings: "'FILL' 1"
                            }}
                        >
                            play_circle
                        </span>
                    }
                    aria-label="Run code"
                    size="sm"
                    variant="ghost"
                    onClick={runCode}
                    isLoading={isLoading}
                    _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
                    }}
                />
                
                {/* AI Assistant toggle button */}
                <IconButton
                    icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="lightblue" class="bi bi-stars" viewBox="0 0 16 16">
                    <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
                    </svg>
                    }
                    aria-label="Toggle AI Assistant"
                    size="sm"
                    variant={isLLMOpen ? "solid" : "ghost"}
                    onClick={toggleLLM}
                    _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
                    }}
                />
            </HStack>
        </Box>
    )
}