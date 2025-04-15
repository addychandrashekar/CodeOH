import { Box, Text, Input, VStack, useColorMode, Button, useToast, Flex } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'
import { useFiles } from '../../context/FileContext'
import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { BACKEND_API_URL } from '../../services/BackendServices'
import { useKindeAuth } from "@kinde-oss/kinde-auth-react"

// Add a simple cache for API responses
const responseCache = new Map();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * ConsoleOutput component that provides a terminal-like interface for command input and output display.
 * Supports different types of entries (input, error, output) with appropriate styling.
 * Integrates with the EditorContext for command handling and history management.
 * 
 * @component
 * @returns {JSX.Element} A console interface with command history and input field
 */
export const ConsoleOutput = () => {
    // Theme and editor context hooks
    const { colorMode } = useColorMode()
    const { handleConsoleInput, consoleHistory } = useEditor()
    const { activeFile, setActiveFile } = useFiles()
    const { user } = useKindeAuth()
    // Local state for input management
    const [inputValue, setInputValue] = useState('')
    const [isFixingIssue, setIsFixingIssue] = useState(false)
    const [isGeneratingTests, setIsGeneratingTests] = useState(false)
    const inputRef = useRef(null)
    const toast = useToast()
    
    // Track pending requests to avoid duplicates
    const pendingRequests = useRef(new Map());
    
    // Check if there's an error in the console history
    const hasError = consoleHistory.some(entry => entry.type === 'error')
    
    // Get the latest error message if available
    const latestError = hasError 
        ? consoleHistory.filter(entry => entry.type === 'error').pop()
        : null

    /**
     * Optimized API call function with caching and debouncing
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise} - API response
     */
    const optimizedApiCall = useCallback(async (endpoint, data, options = {}) => {
        const { skipCache = false, cacheKey = null } = options;
        const effectiveCacheKey = cacheKey || `${endpoint}:${JSON.stringify(data)}`;
        
        // Check for existing pending request
        if (pendingRequests.current.has(effectiveCacheKey)) {
            return pendingRequests.current.get(effectiveCacheKey);
        }
        
        // Check cache if not skipping
        if (!skipCache && responseCache.has(effectiveCacheKey)) {
            const cachedData = responseCache.get(effectiveCacheKey);
            if (Date.now() - cachedData.timestamp < CACHE_TTL) {
                console.log("Using cached response for:", effectiveCacheKey);
                return Promise.resolve(cachedData.data);
            } else {
                // Remove expired entry
                responseCache.delete(effectiveCacheKey);
            }
        }
        
        // Create a new request
        const requestPromise = axios.post(`${BACKEND_API_URL}${endpoint}`, data)
            .then(response => {
                // Cache the response
                if (!skipCache) {
                    // Manage cache size
                    if (responseCache.size >= MAX_CACHE_SIZE) {
                        // Remove oldest entry
                        const oldestKey = Array.from(responseCache.keys())[0];
                        responseCache.delete(oldestKey);
                    }
                    
                    responseCache.set(effectiveCacheKey, {
                        data: response.data,
                        timestamp: Date.now()
                    });
                }
                
                // Remove from pending requests
                pendingRequests.current.delete(effectiveCacheKey);
                return response.data;
            })
            .catch(error => {
                // Remove from pending requests
                pendingRequests.current.delete(effectiveCacheKey);
                throw error;
            });
        
        // Store the pending request
        pendingRequests.current.set(effectiveCacheKey, requestPromise);
        
        return requestPromise;
    }, []);

    /**
     * Handles keyboard input events, specifically the Enter key for command submission
     * @param {React.KeyboardEvent} e - The keyboard event object
     */
    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            if (handleConsoleInput) {
                if (inputValue.trim().toLowerCase() === 'generate tests' || 
                    inputValue.trim().toLowerCase() === 'generate test cases') {
                    setIsGeneratingTests(true);
                    await handleConsoleInput(inputValue);
                    setIsGeneratingTests(false);
                } else {
                    await handleConsoleInput(inputValue);
                }
            }
            setInputValue('')
        }
    }

    // Auto-scroll to the latest input when history updates
    useEffect(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [consoleHistory])

    /**
     * Analyzes an error message and suggests a fix
     * @param {string} errorMessage - The error message to analyze
     */
    const handleFixIssue = async () => {
        if (!latestError || !activeFile) return
        
        setIsFixingIssue(true)
        
        try {
            // Extract filename and line number from error message
            const errorContent = latestError.content
            
            // Get the user ID for backend calls
            const userId = user?.id
            
            // Check if user ID is available
            if (!userId) {
                toast({
                    title: "Authentication Error",
                    description: "User ID not found. Please try logging in again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                setIsFixingIssue(false);
                return;
            }
            
            // Create a prompt to analyze the error and suggest a fix
            const prompt = `
I have the following error in my code:
\`\`\`
${errorContent}
\`\`\`

Here is the code that caused the error:
\`\`\`${activeFile.fileType || 'python'}
${activeFile.content}
\`\`\`

Please analyze the error and suggest a fix. Only provide the corrected code for the function that has the error. Don't modify unrelated functions. Make sure the fix is minimal and focused on addressing the specific error.
`;

            // Create a cache key based on the code and error
            const cacheKey = `fix:${activeFile.key}:${errorContent.substring(0, 100)}`;

            // Call the backend to get an AI-suggested fix using the optimized API call
            const response = await optimizedApiCall('/chat', {
                user_message: prompt,
                user_id: userId
            }, { cacheKey });
            
            const suggestedFix = response.response.text || response.response;
            
            // Extract code from markdown if necessary
            let fixedCode = suggestedFix;
            const codeBlockMatch = suggestedFix.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                fixedCode = codeBlockMatch[1];
            }
            
            // Log the extracted code for debugging
            console.log("AI Response:", {
                original: suggestedFix.substring(0, 100) + "...",
                extracted: fixedCode.substring(0, 100) + "..."
            });
            
            // Identify the function to fix
            // This is a simple implementation - we'll try to find the function name from the error
            const functionNameMatch = errorContent.match(/in ([a-zA-Z0-9_]+)/);
            let functionName = functionNameMatch ? functionNameMatch[1] : null;
            
            if (functionName) {
                // Find the function in the current code
                const functionRegex = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):[\\s\\S]*?(?=\\n\\s*def|\\n\\s*class|\\n\\s*#|\\n\\s*$)`, 'g');
                const matches = activeFile.content.match(functionRegex);
                
                if (matches && matches.length > 0) {
                    // Replace the function with the fixed version
                    let updatedContent = activeFile.content;
                    
                    // Try multiple patterns to extract the fixed function
                    let fixedFunctionMatch = null;
                    
                    // Pattern 1: Try to extract the full function definition up to the next function/class
                    const fixedFunctionRegex1 = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):[\\s\\S]*?(?=\\n\\s*def|\\n\\s*class|\\n\\s*#|\\n\\s*$)`, 'g');
                    fixedFunctionMatch = fixedCode.match(fixedFunctionRegex1);
                    
                    // Pattern 2: If that fails, try a more lenient pattern that just gets the function definition
                    if (!fixedFunctionMatch || fixedFunctionMatch.length === 0) {
                        const fixedFunctionRegex2 = new RegExp(`def\\s+${functionName}[\\s\\S]*`, 'g');
                        fixedFunctionMatch = fixedCode.match(fixedFunctionRegex2);
                    }
                    
                    // Pattern 3: If all else fails, check if the entire response is just the function
                    if (!fixedFunctionMatch || fixedFunctionMatch.length === 0) {
                        if (fixedCode.trim().startsWith(`def ${functionName}`) || 
                            fixedCode.trim().startsWith(`def\t${functionName}`) ||
                            fixedCode.trim().match(new RegExp(`^def\\s+${functionName}`))) {
                            fixedFunctionMatch = [fixedCode.trim()];
                        }
                    }
                    
                    if (fixedFunctionMatch && fixedFunctionMatch.length > 0) {
                        // Only replace the specific function, keeping the rest of the file intact
                        updatedContent = activeFile.content.replace(matches[0], fixedFunctionMatch[0]);
                        
                        console.log("Function replacement:", {
                            originalFunction: matches[0],
                            newFunction: fixedFunctionMatch[0],
                            originalContentLength: activeFile.content.length,
                            newContentLength: updatedContent.length
                        });
                        
                        // Verify that we didn't delete content
                        if (updatedContent.length < activeFile.content.length * 0.8) {
                            console.warn("New content is significantly shorter than original, using fallback approach");
                            
                            // Fallback to a more conservative approach - append the fixed function
                            const originalFuncName = new RegExp(`def\\s+${functionName}\\s*\\(`);
                            
                            if (!originalFuncName.test(fixedFunctionMatch[0])) {
                                throw new Error("The fixed code doesn't contain the expected function name");
                            }
                            
                            // Keep original content but comment out the broken function
                            const commentedOriginal = activeFile.content.replace(matches[0], "# Original function (commented out due to error)\n# " + matches[0].replace(/\n/g, "\n# "));
                            
                            // Add the fixed function
                            updatedContent = commentedOriginal + "\n\n# Fixed function\n" + fixedFunctionMatch[0];
                        }
                    } else {
                        // If we still couldn't extract the function, try one more fallback approach
                        console.warn("Couldn't extract function using regex patterns, using fallback approach");
                        
                        // Check if the AI response contains the function name anywhere
                        if (fixedCode.includes(`def ${functionName}`) || fixedCode.includes(`def\t${functionName}`)) {
                            // Use the whole fixedCode but add a warning comment
                            toast({
                                title: "Limited fix available",
                                description: "Could not extract precise function. Using entire AI response as fallback.",
                                status: "warning",
                                duration: 5000,
                                isClosable: true,
                            });
                            
                            // Append the fixed code with a warning comment
                            const updatedContent = activeFile.content + '\n\n# WARNING: AI-suggested fix (may need manual editing)\n' + fixedCode;
                            
                            // Update the file with the fixed content
                            const updateResponse = await fetch(
                                `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${userId}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        content: updatedContent
                                    }),
                                }
                            );
                            
                            if (updateResponse.ok) {
                                // Update the active file in the UI
                                setActiveFile({
                                    ...activeFile,
                                    content: updatedContent
                                });
                                
                                toast({
                                    title: "Fix appended",
                                    description: "Added AI suggestion to the end of the file",
                                    status: "success",
                                    duration: 5000,
                                    isClosable: true,
                                });
                                return;
                            } else {
                                // Try to get the error details from the response
                                const errorText = await updateResponse.text().catch(() => null);
                                console.error("Error updating file:", {
                                    status: updateResponse.status, 
                                    statusText: updateResponse.statusText,
                                    errorDetails: errorText
                                });
                                throw new Error(`Failed to update the file: ${updateResponse.status} ${updateResponse.statusText}`);
                            }
                        } else {
                            // Add the response to the console instead
                            handleConsoleInput("# AI suggested fix (not applied automatically):");
                            handleConsoleInput(fixedCode);
                            throw new Error("Couldn't extract the fixed function from the AI response");
                        }
                    }
                } else {
                    // If we couldn't locate the specific function, try a more cautious approach
                    // Look for any function that might be related to the error
                    toast({
                        title: "Limited fix applied",
                        description: "Couldn't precisely locate the function. Adding the fixed function at the end of the file.",
                        status: "warning",
                        duration: 5000,
                        isClosable: true,
                    });
                    
                    // Extract the entire function from the AI-suggested fix
                    const fixedFunctionMatch = fixedCode.match(/def\s+([a-zA-Z0-9_]+)\s*\([^)]*\):[\s\S]+/);
                    
                    if (fixedFunctionMatch) {
                        // Append the fixed function at the end of the file
                        const updatedContent = activeFile.content + '\n\n# Fixed version of ' + functionName + '\n' + fixedFunctionMatch[0];
                        
                        // Update the file with the fixed content
                        const updateResponse = await fetch(
                            `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${userId}`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    content: updatedContent
                                }),
                            }
                        );
                        
                        if (updateResponse.ok) {
                            // Update the active file in the UI
                            setActiveFile({
                                ...activeFile,
                                content: updatedContent
                            });
                            
                            toast({
                                title: "Fix applied",
                                description: `Added fixed version of ${functionName}`,
                                status: "success",
                                duration: 5000,
                                isClosable: true,
                            });
                        } else {
                            // Try to get the error details from the response
                            const errorText = await updateResponse.text().catch(() => null);
                            console.error("Error updating file:", {
                                status: updateResponse.status, 
                                statusText: updateResponse.statusText,
                                errorDetails: errorText
                            });
                            throw new Error(`Failed to update the file: ${updateResponse.status} ${updateResponse.statusText}`);
                        }
                    } else {
                        throw new Error("Couldn't extract a function definition from the fix");
                    }
                }
            } else {
                // If we couldn't identify the specific function from the error
                toast({
                    title: "Generic fix",
                    description: "Couldn't identify specific function from the error. Attempting a general fix.",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
                
                // Try to extract a function from the AI response
                const fixedFunctionMatch = fixedCode.match(/def\s+([a-zA-Z0-9_]+)\s*\([^)]*\):[\s\S]+/);
                
                if (fixedFunctionMatch) {
                    // We found a function in the AI response, append it to the file
                    const functionName = fixedFunctionMatch[1];
                    const existingFunctionRegex = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):`, 'g');
                    
                    // Check if this function already exists in the file
                    if (existingFunctionRegex.test(activeFile.content)) {
                        // Try to replace the existing function
                        const fullFunctionRegex = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):[\\s\\S]*?(?=\\n\\s*def|\\n\\s*class|\\n\\s*#|\\n\\s*$)`, 'g');
                        const matches = activeFile.content.match(fullFunctionRegex);
                        
                        if (matches && matches.length > 0) {
                            // Replace the function
                            const updatedContent = activeFile.content.replace(matches[0], fixedFunctionMatch[0]);
                            
                            // Update the file with the fixed content
                            const updateResponse = await fetch(
                                `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${userId}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        content: updatedContent
                                    }),
                                }
                            );
                            
                            if (updateResponse.ok) {
                                // Update the active file in the UI
                                setActiveFile({
                                    ...activeFile,
                                    content: updatedContent
                                });
                                
                                toast({
                                    title: "Fix applied",
                                    description: `Updated the ${functionName} function`,
                                    status: "success",
                                    duration: 5000,
                                    isClosable: true,
                                });
                                return;
                            }
                        }
                    }
                    
                    // If we couldn't replace, append the function
                    const updatedContent = activeFile.content + '\n\n# Fixed function added by AI\n' + fixedFunctionMatch[0];
                    
                    // Update the file with the fixed content
                    const updateResponse = await fetch(
                        `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${userId}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                content: updatedContent
                            }),
                        }
                    );
                    
                    if (updateResponse.ok) {
                        // Update the active file in the UI
                        setActiveFile({
                            ...activeFile,
                            content: updatedContent
                        });
                        
                        toast({
                            title: "Fix applied",
                            description: `Added the ${functionName} function`,
                            status: "success",
                            duration: 5000,
                            isClosable: true,
                        });
                    } else {
                        // Try to get the error details from the response
                        const errorText = await updateResponse.text().catch(() => null);
                        console.error("Error updating file:", {
                            status: updateResponse.status, 
                            statusText: updateResponse.statusText,
                            errorDetails: errorText
                        });
                        throw new Error(`Failed to update the file: ${updateResponse.status} ${updateResponse.statusText}`);
                    }
                } else {
                    // We couldn't find a function in the AI response
                    // As a last resort, suggest the fix but don't apply it
                    toast({
                        title: "Fix suggestion",
                        description: "Couldn't identify a function to fix. Here's the suggested fix in the console.",
                        status: "info",
                        duration: 5000,
                        isClosable: true,
                    });
                    
                    // Add the suggested fix to the console
                    handleConsoleInput("# Suggested fix from AI (not applied to file):");
                    handleConsoleInput(fixedCode);
                }
            }
        } catch (error) {
            console.error("Error fixing issue:", error);
            toast({
                title: "Error",
                description: "Failed to apply the fix: " + error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsFixingIssue(false);
        }
    };

    /**
     * Determines the style for different types of console entries
     * @param {Object} entry - The console entry object
     * @param {('input'|'error'|'output')} entry.type - The type of console entry
     * @returns {Object} Style object for the entry
     */
    const getEntryStyle = (entry) => {
        // Base styling for all entry types
        const baseStyle = {
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "14px",
            padding: "2px 4px",
            borderRadius: "4px",
            marginBottom: "2px"
        }
        // Apply specific styles based on entry type
        switch (entry.type) {
            case 'input':
                return {
                    ...baseStyle,
                    color: colorMode === 'dark' ? '#98c379' : '#50a14f',
                    backgroundColor: colorMode === 'dark' ? 'rgba(152, 195, 121, 0.1)' : 'rgba(80, 161, 79, 0.1)'
                }
            case 'error':
                return {
                    ...baseStyle,
                    color: colorMode === 'dark' ? '#e06c75' : '#e45649',
                    backgroundColor: colorMode === 'dark' ? 'rgba(224, 108, 117, 0.1)' : 'rgba(228, 86, 73, 0.1)'
                }
            default:
                return {
                    ...baseStyle,
                    color: colorMode === 'dark' ? '#abb2bf' : '#383a42'
                }
        }
    }

    return (
        <Box 
            gridArea='console'
            bg={colorMode === 'dark' ? '#282c34' : '#fafafa'}
            p={4}
            h="100%"
            borderTop="1px"
            borderColor={colorMode === 'dark' ? '#3e4451' : '#e5e5e6'}
            overflowY="auto"
            position="relative"
        >
            {/* Fix Issue Button - Only visible when error exists and file is open */}
            {hasError && activeFile && (
                <Box position="absolute" top="10px" right="10px" zIndex="1">
                    <Button
                        size="sm"
                        colorScheme="red"
                        onClick={handleFixIssue}
                        isLoading={isFixingIssue}
                        loadingText="Fixing..."
                    >
                        Fix Issue
                    </Button>
                </Box>
            )}
            
            <VStack align="stretch" spacing={1}>
                {/* Display console history entries */}
                {consoleHistory.map((entry, index) => (
                    <Text 
                        key={index} 
                        sx={getEntryStyle(entry)}
                    >
                        {entry.type === 'input' ? (
                            <span>
                                <Text as="span" color={colorMode === 'dark' ? '#61afef' : '#4078f2'}>➜ </Text>
                                {entry.content}
                                {entry.content.includes('# AI suggested fix') && activeFile && (
                                    <Button
                                        size="xs"
                                        colorScheme="green"
                                        ml={2}
                                        onClick={async () => {
                                            // Get the next entry which contains the actual fix
                                            const fixCode = consoleHistory[index + 1]?.content;
                                            if (!fixCode) return;
                                            
                                            try {
                                                // Find the function name
                                                const functionMatch = fixCode.match(/def\s+([a-zA-Z0-9_]+)/);
                                                const functionName = functionMatch ? functionMatch[1] : null;
                                                
                                                if (!functionName) {
                                                    toast({
                                                        title: "Error",
                                                        description: "Couldn't identify function name in the fix",
                                                        status: "error",
                                                        duration: 3000,
                                                        isClosable: true,
                                                    });
                                                    return;
                                                }
                                                
                                                // Clean up the fixCode to ensure proper indentation and no duplication
                                                let cleanedFixCode = fixCode;
                                                
                                                // Remove any duplicate function definitions that might be in the suggested fix
                                                // This regex finds all occurrences of a return statement followed by another if statement in the same function
                                                const dupeRegex = /(return\s+[^;\n]+)\s+\s+if\s+/g;
                                                if (dupeRegex.test(cleanedFixCode)) {
                                                    // Get only the first complete function definition
                                                    const firstDefRegex = new RegExp(`(def\\s+${functionName}[\\s\\S]*?return\\s+[^;\\n]+)`, 'm');
                                                    const firstDefMatch = cleanedFixCode.match(firstDefRegex);
                                                    if (firstDefMatch && firstDefMatch[1]) {
                                                        cleanedFixCode = firstDefMatch[1];
                                                    }
                                                }
                                                
                                                // Try to find and replace the existing function
                                                const functionRegex = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):[\\s\\S]*?(?=\\n\\s*def|\\n\\s*class|\\n\\s*#|$)`, 'g');
                                                const matches = activeFile.content.match(functionRegex);
                                                
                                                let updatedContent;
                                                if (matches && matches.length > 0) {
                                                    // Get the original function
                                                    const originalFunction = matches[0];
                                                    
                                                    // Replace the function
                                                    updatedContent = activeFile.content.replace(originalFunction, cleanedFixCode);
                                                    
                                                    // Verify the replacement makes sense
                                                    if (updatedContent === activeFile.content) {
                                                        toast({
                                                            title: "Warning",
                                                            description: "The fix didn't change the code. Trying alternate approach.",
                                                            status: "warning",
                                                            duration: 3000,
                                                            isClosable: true,
                                                        });
                                                        
                                                        // Try another approach with more specific matching
                                                        updatedContent = activeFile.content.split(originalFunction).join(cleanedFixCode);
                                                    }
                                                    
                                                    // Check if the updated content has reasonable length
                                                    if (updatedContent.length < activeFile.content.length * 0.5 || 
                                                        updatedContent.length > activeFile.content.length * 1.5) {
                                                        throw new Error("The updated content has an unexpected length, which might indicate a problem with the replacement");
                                                    }
                                                } else {
                                                    // Append the fix
                                                    updatedContent = activeFile.content + '\n\n# Fixed function\n' + cleanedFixCode;
                                                }
                                                
                                                // Update the file
                                                const userId = user?.id;
                                                if (!userId) {
                                                    toast({
                                                        title: "Authentication Error",
                                                        description: "User ID not found.",
                                                        status: "error",
                                                        duration: 3000,
                                                        isClosable: true,
                                                    });
                                                    return;
                                                }
                                                
                                                const updateResponse = await fetch(
                                                    `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${userId}`,
                                                    {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify({
                                                            content: updatedContent
                                                        }),
                                                    }
                                                );
                                                
                                                if (updateResponse.ok) {
                                                    // Update the UI
                                                    setActiveFile({
                                                        ...activeFile,
                                                        content: updatedContent
                                                    });
                                                    
                                                    toast({
                                                        title: "Fix applied",
                                                        description: `Applied the suggested fix for ${functionName}`,
                                                        status: "success",
                                                        duration: 3000,
                                                        isClosable: true,
                                                    });
                                                } else {
                                                    throw new Error(`Failed to update file: ${updateResponse.status}`);
                                                }
                                            } catch (error) {
                                                console.error("Error applying fix:", error);
                                                toast({
                                                    title: "Error",
                                                    description: `Failed to apply fix: ${error.message}`,
                                                    status: "error",
                                                    duration: 3000,
                                                    isClosable: true,
                                                });
                                            }
                                        }}
                                    >
                                        Apply Fix
                                    </Button>
                                )}
                            </span>
                        ) : entry.content}
                    </Text>
                ))}
                {/* Command input field */}
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isGeneratingTests ? "Generating tests..." : "Enter command..."}
                    bg="transparent"
                    border="none"
                    _focus={{ boxShadow: 'none' }}
                    spellCheck="false"
                    autoComplete="off"
                    color={colorMode === 'dark' ? '#abb2bf' : '#383a42'}
                    pl={2}
                    fontSize="14px"
                    fontFamily="monospace"
                    isDisabled={isGeneratingTests}
                    sx={{
                        '&::placeholder': {
                            color: colorMode === 'dark' ? '#5c6370' : '#a0a1a7'
                        }
                    }}
                />
            </VStack>
        </Box>
    )
}