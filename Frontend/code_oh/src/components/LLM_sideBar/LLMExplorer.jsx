import { Box, useColorMode, Avatar, Text, Flex, Divider, Menu, MenuButton, MenuList, MenuItem, Button, Icon, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, PopoverFooter, PopoverArrow, PopoverCloseButton, Textarea, useDisclosure, Select, useToast } from '@chakra-ui/react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "../../styles/searchInput.css";
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SearchInput from './SearchInput';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BACKEND_API_URL } from '../../services/BackendServices';
import { FiCode, FiUser, FiChevronDown, FiInfo, FiSearch, FiZap, FiHelpCircle } from 'react-icons/fi';
import { useFiles } from '../../context/FileContext';

const MarkdownRenderer = ({ content }) => (
  <ReactMarkdown
    children={content}
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter 
            language={match[1]} 
            style={vscDarkPlus} 
            PreTag="div" 
            customStyle={{
              borderRadius: '8px',
              margin: '12px 0',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code 
            className={className} 
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.2)', 
              padding: '2px 4px', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }} 
            {...props}
          >
            {children}
          </code>
        );
      }
    }}
  />
);

export const LLMExplorer = ({ userId }) => {
  const { colorMode } = useColorMode();
  const bgColor = colorMode === 'dark' ? '#1A202C' : '#F7FAFC';
  const userBubbleBg = colorMode === 'dark' ? '#4A5568' : '#CBD5E0';
  const llmBubbleBg = colorMode === 'dark' ? '#2D3748' : '#E2E8F0';
  const headerBg = colorMode === 'dark' ? '#171923' : '#EDF2F7';
  const { isOpen: isOptimizeOpen, onOpen: onOptimizeOpen, onClose: onOptimizeClose } = useDisclosure();
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const toast = useToast();
  const { files, setFiles } = useFiles();

  // State to track chat messages
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // State for code optimization textarea
  const [codeToOptimize, setCodeToOptimize] = useState('');
  
  // State for code generation description
  const [codeGenerationDesc, setCodeGenerationDesc] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('Python');

  // Example code explanation prompts
  const codeExplanationPrompts = [
    "Explain how user registration works in this codebase",
    "Explain the database connection setup",
    "How does authentication work in this application?",
    "Explain the file upload process",
    "What's the purpose of the JWT token implementation?",
    "Explain the project structure and architecture"
  ];

  // Example code optimization prompts
  const codeOptimizationPrompts = [
    "Optimize this function: def parse_data(data, symbol: str):\n    data = data['data']\n    for x in data:\n        if x['instId'] == symbol:\n            return x",
    "Improve the efficiency of this code: for i in range(len(data)):\n    if data[i] > threshold:\n        results.append(data[i])",
    "Suggest a better way to handle database connections in the project",
    "How can I make API endpoints more efficient and handle errors better?",
    "Optimize this function for both readability and performance: def is_number(s):\n    try:\n        float(s)\n        return True\n    except ValueError:\n        try:\n            int(s)\n            return True\n        except ValueError:\n            return False",
    "How can I refactor the file upload process to be more maintainable and efficient?"
  ];

  // Example code generation prompts
  const codeGenerationPrompts = [
    "Write a function to validate email addresses in Python",
    "Create a React component for a file upload form with progress bar",
    "Write a function to calculate mean, median, and mode without using the statistics library",
    "Generate a SQL query to find the top 5 customers by order value",
    "Create a Python decorator for caching function results",
    "Write a TypeScript interface for a user authentication system"
  ];

  // Available language options for code generation
  const languageOptions = [
    'Python', 
    'JavaScript', 
    'TypeScript', 
    'Java', 
    'C#', 
    'PHP', 
    'Ruby',
    'Go',
    'Rust',
    'SQL'
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const HorizontalResizeHandle = () => (
    <PanelResizeHandle
      style={{
        height: '4px',
        background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
        cursor: 'row-resize'
      }}
    />
  );

  // Function to handle prompt selection
  const handlePromptSelect = (prompt) => {
    handleSendMessage(prompt);
  };

  // Helper function to check if a message is a file creation request
  const isFileCreationRequest = (message) => {
    const lowerMsg = message.toLowerCase();
    return (
      (lowerMsg.includes('create') || lowerMsg.includes('make') || lowerMsg.includes('generate')) &&
      (lowerMsg.includes('file') || lowerMsg.includes('.py') || lowerMsg.includes('.js') || 
       lowerMsg.includes('.tsx') || lowerMsg.includes('.jsx') || lowerMsg.includes('.css') || 
       lowerMsg.includes('.html') || lowerMsg.includes('.json') || lowerMsg.includes('.md')) &&
      (lowerMsg.includes('called') || lowerMsg.includes('named'))
    );
  };

  // Helper function to check if a message is a file modification request
  const isFileModificationRequest = (message) => {
    const lowerMsg = message.toLowerCase();
    return (
      (lowerMsg.includes('modify') || lowerMsg.includes('update') || lowerMsg.includes('change') || 
       lowerMsg.includes('edit') || lowerMsg.includes('optimize') || lowerMsg.includes('improve') ||
       lowerMsg.includes('refactor') || lowerMsg.includes('fix') || lowerMsg.includes('add to')) &&
      (lowerMsg.includes('file') || lowerMsg.includes('.py') || lowerMsg.includes('.js') || 
       lowerMsg.includes('.tsx') || lowerMsg.includes('.jsx') || lowerMsg.includes('.css') || 
       lowerMsg.includes('.html') || lowerMsg.includes('.json') || lowerMsg.includes('.md')) &&
      !lowerMsg.includes('called') && !lowerMsg.includes('named')
    );
  };

  // Helper function to extract filename from a modification request
  const extractFilenameFromModification = (message) => {
    // Try different patterns to extract the filename
    const patterns = [
      /(?:modify|update|change|edit|optimize|improve|refactor|fix)(?:\s+the)?\s+file\s+(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)/i,
      /(?:modify|update|change|edit|optimize|improve|refactor|fix)(?:\s+the)?\s+(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)/i,
      /(?:the\s+)?(?:method|function)(?:\s+\w+)?\s+in\s+(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)/i,
      /(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)(?:\s+and)/i,
      /add\s+(?:to|in)\s+(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/['"]/g, ''); // Remove quotes if present
      }
    }
    
    // If none of the patterns matched, try looking for any filename-like pattern
    const filenamePattern = /(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)/i;
    const match = message.match(filenamePattern);
    if (match && match[1]) {
      return match[1].replace(/['"]/g, '');
    }
    
    return null;
  };

  // Helper function to extract method/function to modify
  const extractMethodName = (message) => {
    const methodPatterns = [
      /(?:method|function)\s+([a-zA-Z0-9_]+)/i,
      /(?:optimize|improve|refactor|fix)\s+(?:the\s+)?(?:method|function)?\s+([a-zA-Z0-9_]+)/i,
    ];

    for (const pattern of methodPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Helper function to extract filename from a file creation request
  const extractFilename = (message) => {
    // Try different patterns to extract the filename
    const patterns = [
      /(?:create|make|generate)(?:\s+a)?\s+(?:new\s+)?file\s+(?:called|named)?\s+['"]?([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)['"]?/i,
      /(?:create|make|generate)(?:\s+a)?\s+(?:new\s+)?(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)\s+file/i,
      /(?:called|named)\s+['"]?([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)['"]?/i,
      /create\s+(?:new\s+)?(['"]?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+['"]?)/i, // Simple "create filename.py" pattern
      /['"]?([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)['"]?/i, // Find anything that looks like a filename
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/['"]/g, ''); // Remove quotes if present
      }
    }
    
    return null;
  };

  // Utility function to fetch and update files from the backend
  const fetchAndUpdateFiles = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/files?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Extract the children from the default project
        const filesWithoutDefault = data.files?.[0]?.children || [];
        setFiles(filesWithoutDefault);
        console.log('Files refreshed successfully');
      } else {
        console.error("Error fetching files");
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  // Function to create a file with the given name and content
  const createFile = async (fileName, content) => {
    try {
      console.log(`Creating file: ${fileName} with content length: ${content.length}`);
      
      // Request the backend to create the file
      const res = await axios.post(`${BACKEND_API_URL}/api/files/create`, {
        fileName,
        content,
        userId
      });
      
      if (res.data && res.data.success) {
        toast({
          title: "File created",
          description: `Successfully created ${fileName} - view it in the file explorer!`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh the file list after successful file creation
        await fetchAndUpdateFiles();
        
        return true;
      } else {
        toast({
          title: "File creation failed",
          description: res.data.message || "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: "File creation failed",
        description: error.message || "Server error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Function to get file content from the backend
  const getFileContent = async (fileName) => {
    try {
      const cleanKey = fileName.replace(/['"]/g, '').trim();
      console.log(`Fetching content for file: ${cleanKey}`);
      
      const response = await fetch(
        `${BACKEND_API_URL}/api/files/${cleanKey}/content?userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return { 
          content: data.content || '', 
          fileType: data.fileType || cleanKey.split('.').pop() 
        };
      } else {
        console.error("Error fetching file content:", await response.json());
        return null;
      }
    } catch (error) {
      console.error("Error getting file content:", error);
      return null;
    }
  };

  // Function to update file content
  const updateFile = async (fileName, content) => {
    try {
      const cleanKey = fileName.replace(/['"]/g, '').trim();
      console.log(`Updating file: ${cleanKey} with content length: ${content.length}`);
      
      const response = await fetch(
        `${BACKEND_API_URL}/api/files/${cleanKey}/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            content,
          }),
        }
      );
      
      if (response.ok) {
        toast({
          title: "File updated",
          description: `Successfully updated ${fileName}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh files list after update
        await fetchAndUpdateFiles();
        
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "File update failed",
          description: errorData.detail || "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating file:", error);
      toast({
        title: "File update failed",
        description: error.message || "Server error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Function passed to SearchInput to handle sending user messages
  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    // Optimistically add user message to chat
    const newMessages = [...messages, { type: 'user', text: userMessage }];
    setMessages(newMessages);

    try {
      // Check if this is a file creation request
      if (isFileCreationRequest(userMessage)) {
        const fileName = extractFilename(userMessage);
        
        if (fileName) {
          // Add AI processing message
          setMessages([...newMessages, { 
            type: 'llm', 
            text: `I'll create a new file called **${fileName}** for you. Let me generate the content...` 
          }]);
          
          // First, generate the file content using the LLM
          const filePrompt = `
I need to create a new file called ${fileName} based on this description:
"${userMessage}"

Please generate the complete code for this file. The code should be production-ready, well-commented, and follow best practices.
Use exactly the requested filename: ${fileName}
Return ONLY the code without any explanations outside the code.`;

          const contentRes = await axios.post(`${BACKEND_API_URL}/chat`, {
            user_message: filePrompt,
            user_id: userId
          });
          
          const generatedContent = contentRes.data.response.text || contentRes.data.response;
          
          // Extract code from markdown if necessary
          let fileContent = generatedContent;
          const codeBlockMatch = generatedContent.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            fileContent = codeBlockMatch[1];
          }
          
          // Create the file with the generated content
          const success = await createFile(fileName, fileContent);
          
          if (success) {
            // Update the message to show success
            setMessages(prev => [
              ...prev.slice(0, -1), // Remove "processing" message
              { 
                type: 'llm', 
                text: `✅ I've created the file **${fileName}** with the following content:

\`\`\`${fileName.split('.').pop()}
${fileContent}
\`\`\`

The file has been successfully saved to your project and is now available in the file explorer on the left.`
              }
            ]);
          } else {
            // Update the message to show failure
            setMessages(prev => [
              ...prev.slice(0, -1), // Remove "processing" message
              { 
                type: 'llm', 
                text: `⚠️ I generated the code for **${fileName}**, but couldn't save the file. Here's the code I created:

\`\`\`${fileName.split('.').pop()}
${fileContent}
\`\`\`

Please try saving it manually or check your permissions.`
              }
            ]);
          }
          
          return; // Stop processing since we've handled the file creation
        }
      }
      // Check if this is a file modification request
      else if (isFileModificationRequest(userMessage)) {
        const fileName = extractFilenameFromModification(userMessage);
        const methodName = extractMethodName(userMessage);
        
        if (fileName) {
          // Add AI processing message
          setMessages([...newMessages, { 
            type: 'llm', 
            text: `I'll modify the file **${fileName}** for you. Let me analyze the current content first...` 
          }]);
          
          // First, fetch the existing file content
          const fileData = await getFileContent(fileName);
          
          if (!fileData || !fileData.content) {
            setMessages(prev => [
              ...prev.slice(0, -1), // Remove "processing" message
              { 
                type: 'llm', 
                text: `⚠️ I couldn't find the file **${fileName}** in your project. Please make sure the file exists and try again.`
              }
            ]);
            return;
          }
          
          // Construct prompt for modifying the file
          let modificationPrompt = `
I need to modify the existing file ${fileName} based on this request:
"${userMessage}"

Here is the current content of ${fileName}:
\`\`\`
${fileData.content}
\`\`\`
`;

          // Add specific instructions based on the type of modification
          if (methodName) {
            modificationPrompt += `
Please focus on modifying/optimizing the ${methodName} function/method. 
`;
          }

          modificationPrompt += `
Make the requested changes while preserving the overall structure and style of the code.
Return the COMPLETE updated file content, not just the changes.
Do not include any explanatory text - I need only the final code.
`;

          // Send prompt to the LLM
          const contentRes = await axios.post(`${BACKEND_API_URL}/chat`, {
            user_message: modificationPrompt,
            user_id: userId
          });
          
          const generatedContent = contentRes.data.response.text || contentRes.data.response;
          
          // Extract code from markdown if necessary
          let modifiedContent = generatedContent;
          const codeBlockMatch = generatedContent.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            modifiedContent = codeBlockMatch[1];
          }
          
          // Update the file with the modified content
          const success = await updateFile(fileName, modifiedContent);
          
          if (success) {
            // Create a simple diff to highlight changes (basic implementation)
            const originalLines = fileData.content.split('\n');
            const modifiedLines = modifiedContent.split('\n');
            
            // Update the message to show success
            setMessages(prev => [
              ...prev.slice(0, -1), // Remove "processing" message
              { 
                type: 'llm', 
                text: `✅ I've updated the file **${fileName}** as requested. Here's the modified content:

\`\`\`${fileName.split('.').pop()}
${modifiedContent}
\`\`\`

The changes have been saved to your project.`
              }
            ]);
          } else {
            // Update the message to show failure
            setMessages(prev => [
              ...prev.slice(0, -1), // Remove "processing" message
              { 
                type: 'llm', 
                text: `⚠️ I generated the updated code for **${fileName}**, but couldn't save the changes. Here's the modified code:

\`\`\`${fileName.split('.').pop()}
${modifiedContent}
\`\`\`

Please try updating it manually.`
              }
            ]);
          }
          
          return; // Stop processing since we've handled the file modification
        }
      }
      
      // For non-file operations, proceed with normal message handling
      // Add optimization context if the message contains optimization keywords
      let enhancedMessage = userMessage;
      
      // Check if message is about code optimization
      if (
        (userMessage.toLowerCase().includes('optimize') || 
         userMessage.toLowerCase().includes('improve') || 
         userMessage.toLowerCase().includes('better') ||
         userMessage.toLowerCase().includes('efficient')) && 
        (userMessage.toLowerCase().includes('function') || 
         userMessage.toLowerCase().includes('code') ||
         userMessage.toLowerCase().includes('parse_data'))
      ) {
        // Add specific optimization context
        enhancedMessage = `Analyze and optimize the following code or function. 
Consider these optimization techniques:
1. Time complexity - Check for inefficient loops or algorithms
2. Space complexity - Identify memory usage issues
3. Python-specific optimizations - Use list comprehensions, generators, or built-in functions
4. Error handling - Add proper validation and error handling
5. Code readability - Simplify complex logic and add clarifying comments

Here is the code or query to optimize: ${userMessage}

Provide a specific, step-by-step optimization with code examples showing BOTH the original and improved versions.`;
      }
      // Check if message is about code generation
      else if (
        (userMessage.toLowerCase().includes('write') || 
         userMessage.toLowerCase().includes('generate') || 
         userMessage.toLowerCase().includes('create') ||
         userMessage.toLowerCase().includes('implement')) && 
        (userMessage.toLowerCase().includes('function') || 
         userMessage.toLowerCase().includes('code') ||
         userMessage.toLowerCase().includes('component') ||
         userMessage.toLowerCase().includes('class') ||
         userMessage.toLowerCase().includes('algorithm'))
      ) {
        // Extract language context from the message
        let language = 'Python';
        if (userMessage.toLowerCase().includes('javascript') || userMessage.toLowerCase().includes('js')) {
          language = 'JavaScript';
        } else if (userMessage.toLowerCase().includes('typescript') || userMessage.toLowerCase().includes('ts')) {
          language = 'TypeScript';
        } else if (userMessage.toLowerCase().includes('java')) {
          language = 'Java';
        } else if (userMessage.toLowerCase().includes('c#') || userMessage.toLowerCase().includes('csharp')) {
          language = 'C#';
        } else if (userMessage.toLowerCase().includes('react')) {
          language = 'JavaScript/React';
        } else if (userMessage.toLowerCase().includes('sql')) {
          language = 'SQL';
        }
        
        // Add specific generation context
        enhancedMessage = `Generate ${language} code based on this description:
"${userMessage}"

Please create production-ready, well-commented ${language} code with proper error handling and best practices. Include:
1. Function/class/component signatures with appropriate parameters and return types
2. Thorough input validation and error handling
3. Well-structured implementation with clean code principles
4. Explanatory comments for complex parts
5. Examples of usage if appropriate

Format the response with markdown code blocks and brief explanations.`;
      }
      
      const res = await axios.post(`${BACKEND_API_URL}/chat`, {
        user_message: enhancedMessage,
        user_id: userId
      });

      const llmReply = res.data.response;
      setMessages([...newMessages, { type: 'llm', text: llmReply.text || llmReply }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, { type: 'llm', text: '⚠️ Error from LLM response' }]);
    }
  };

  // Handle code optimization request
  const handleOptimizeCode = () => {
    if (!codeToOptimize.trim()) return;
    
    const optimizationPrompt = `Optimize this code for better performance, readability, and maintainability:
\`\`\`
${codeToOptimize}
\`\`\`

Please analyze the code and suggest specific improvements with detailed explanations. Show both the original and optimized versions.`;
    
    handleSendMessage(optimizationPrompt);
    setCodeToOptimize('');
    onOptimizeClose();
  };

  // Handle code generation request
  const handleGenerateCode = () => {
    if (!codeGenerationDesc.trim()) return;
    
    const generationPrompt = `Generate ${codeLanguage} code based on this description:
"${codeGenerationDesc}"

Please create production-ready, well-commented ${codeLanguage} code with proper error handling and best practices. Include explanations for key parts of the implementation.`;
    
    handleSendMessage(generationPrompt);
    setCodeGenerationDesc('');
    onGenerateClose();
  };

  return (
    <PanelGroup direction="vertical">
      {/* Chat header */}
      <Box 
        p={2} 
        bg={headerBg} 
        borderBottom="1px solid" 
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap={2}>
            <FiCode size={20} color={colorMode === 'dark' ? '#90CDF4' : '#3182CE'} />
            <Text fontWeight="bold">AI Assistant</Text>
          </Flex>
          
          <Flex gap={1}>
            {/* Code Explanation dropdown menu */}
            <Menu>
              <MenuButton 
                as={Button} 
                size="xs" 
                variant="ghost" 
                rightIcon={<FiChevronDown size={12} />}
                leftIcon={<FiInfo size={12} />}
                fontSize="xs"
                px={2}
              >
                Explain
              </MenuButton>
              <MenuList fontSize="sm">
                <MenuItem fontWeight="bold" isDisabled>Code Explanation Prompts:</MenuItem>
                <Divider />
                {codeExplanationPrompts.map((prompt, index) => (
                  <MenuItem 
                    key={index} 
                    onClick={() => handlePromptSelect(prompt)}
                    py={2}
                  >
                    {prompt}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {/* Code Optimization dropdown menu */}
            <Menu>
              <MenuButton 
                as={Button} 
                size="xs" 
                variant="ghost" 
                rightIcon={<FiChevronDown size={12} />}
                leftIcon={<FiZap size={12} />}
                fontSize="xs"
                px={2}
              >
                Optimize
              </MenuButton>
              <MenuList fontSize="sm">
                <MenuItem fontWeight="bold" isDisabled>Code Optimization Prompts:</MenuItem>
                <Divider />
                {codeOptimizationPrompts.map((prompt, index) => (
                  <MenuItem 
                    key={index} 
                    onClick={() => handlePromptSelect(prompt)}
                    py={2}
                  >
                    {prompt}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem 
                  icon={<FiZap />} 
                  fontWeight="bold" 
                  onClick={onOptimizeOpen}
                >
                  Optimize Your Code...
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Direct Optimize Code Button */}
            <Button
              size="xs"
              colorScheme="green"
              leftIcon={<FiZap size={12} />}
              fontSize="xs"
              onClick={onOptimizeOpen}
            >
              Optimize Code
            </Button>

            {/* Code Generation dropdown menu */}
            <Menu>
              <MenuButton 
                as={Button} 
                size="xs" 
                variant="ghost" 
                rightIcon={<FiChevronDown size={12} />}
                leftIcon={<FiCode size={12} />}
                fontSize="xs"
                px={2}
                colorScheme="purple"
              >
                Generate
              </MenuButton>
              <MenuList fontSize="sm">
                <MenuItem fontWeight="bold" isDisabled>Code Generation Prompts:</MenuItem>
                <Divider />
                {codeGenerationPrompts.map((prompt, index) => (
                  <MenuItem 
                    key={index} 
                    onClick={() => handlePromptSelect(prompt)}
                    py={2}
                  >
                    {prompt}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem 
                  icon={<FiCode />} 
                  fontWeight="bold" 
                  onClick={onGenerateOpen}
                >
                  Create Custom Code...
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Direct Generate Code Button */}
            <Button
              size="xs"
              colorScheme="purple"
              leftIcon={<FiCode size={12} />}
              fontSize="xs"
              onClick={onGenerateOpen}
            >
              Generate Code
            </Button>

            {/* Code Search button - placeholder for future integration */}
            <Menu>
              <MenuButton 
                as={Button} 
                size="xs" 
                variant="ghost" 
                rightIcon={<FiChevronDown size={12} />}
                leftIcon={<FiSearch size={12} />}
                fontSize="xs"
                px={2}
              >
                Search
              </MenuButton>
              <MenuList fontSize="sm">
                <MenuItem fontWeight="bold" isDisabled>Code Search Prompts:</MenuItem>
                <Divider />
                <MenuItem onClick={() => handlePromptSelect("Find code related to user authentication")}>
                  Find code related to user authentication
                </MenuItem>
                <MenuItem onClick={() => handlePromptSelect("Where is the database schema defined?")}>
                  Where is the database schema defined?
                </MenuItem>
                <MenuItem onClick={() => handlePromptSelect("Show me all API endpoints")}>
                  Show me all API endpoints
                </MenuItem>
                <MenuItem onClick={() => handlePromptSelect("Find code for file uploads")}>
                  Find code for file uploads
                </MenuItem>
                <MenuItem onClick={() => handlePromptSelect("Where are the error handlers defined?")}>
                  Where are the error handlers defined?
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
      </Box>
      
      {/* Code Optimization Popover */}
      <Popover
        isOpen={isOptimizeOpen}
        onClose={onOptimizeClose}
        placement="bottom"
        closeOnBlur={false}
      >
        <PopoverTrigger>
          <span style={{ display: 'none' }}></span>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader fontWeight="bold">Optimize Your Code</PopoverHeader>
          <PopoverBody>
            <Text mb={2} fontSize="sm">Paste your code below for optimization suggestions:</Text>
            <Textarea
              value={codeToOptimize}
              onChange={(e) => setCodeToOptimize(e.target.value)}
              placeholder="def parse_data(data, symbol):\n    # Paste your code here"
              size="sm"
              height="150px"
              fontFamily="monospace"
            />
          </PopoverBody>
          <PopoverFooter display="flex" justifyContent="flex-end">
            <Button size="sm" colorScheme="green" onClick={handleOptimizeCode}>
              Optimize
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
      
      {/* Code Generation Popover */}
      <Popover
        isOpen={isGenerateOpen}
        onClose={onGenerateClose}
        placement="bottom"
        closeOnBlur={false}
      >
        <PopoverTrigger>
          <span style={{ display: 'none' }}></span>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader fontWeight="bold">Generate Custom Code</PopoverHeader>
          <PopoverBody>
            <Flex direction="column" gap={3}>
              <Box>
                <Text mb={1} fontSize="sm">Select language:</Text>
                <Select 
                  size="sm" 
                  value={codeLanguage} 
                  onChange={(e) => setCodeLanguage(e.target.value)}
                >
                  {languageOptions.map((lang, idx) => (
                    <option key={idx} value={lang}>{lang}</option>
                  ))}
                </Select>
              </Box>
              
              <Box>
                <Text mb={1} fontSize="sm">Describe the code you want to generate:</Text>
                <Textarea
                  value={codeGenerationDesc}
                  onChange={(e) => setCodeGenerationDesc(e.target.value)}
                  placeholder="Write a function to calculate mean, median, and mode without using the statistics library"
                  size="sm"
                  height="120px"
                />
              </Box>
            </Flex>
          </PopoverBody>
          <PopoverFooter display="flex" justifyContent="flex-end">
            <Button size="sm" colorScheme="purple" onClick={handleGenerateCode}>
              Generate
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>

      <Panel defaultSize={75} minSize={20} maxSize={90}>
        <Box 
          className="chat-container" 
          h="100%" 
          bg={bgColor} 
          overflowY="auto"
          p={4}
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: colorMode === 'dark' ? '#4A5568' : '#CBD5E0',
              borderRadius: '4px',
            },
          }}
        >
          {messages.length === 0 ? (
            <Flex direction="column" alignItems="center" justifyContent="center" h="100%" textAlign="center">
              <FiCode size={40} color={colorMode === 'dark' ? '#90CDF4' : '#3182CE'} />
              <Text mt={6} fontSize="lg" fontWeight="bold">How can I help with your code today?</Text>
              <Text fontSize="sm" mt={2} mb={8} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                I can help explain, optimize, or debug your code
              </Text>
              
              <Flex direction="column" gap={4} w="100%" maxW="500px">
                <Text fontSize="xs" color={colorMode === 'dark' ? 'blue.300' : 'blue.500'} textAlign="center" mb={0}>
                  Try saying: <em>"Create a new file called sentiment.py that analyzes text sentiment"</em> or <em>"Modify stats.py to optimize the calculate_median function"</em>
                </Text>

                <Flex 
                  p={4} 
                  borderRadius="md" 
                  borderWidth="1px" 
                  alignItems="flex-start" 
                  gap={3}
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                  cursor="pointer"
                  _hover={{ 
                    bg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
                    borderColor: colorMode === 'dark' ? 'blue.500' : 'blue.300', 
                  }}
                  onClick={() => handlePromptSelect("Explain how user registration works in this codebase")}
                >
                  <Icon as={FiInfo} mt={1} color={colorMode === 'dark' ? 'blue.300' : 'blue.500'} />
                  <Box>
                    <Text fontWeight="bold" fontSize="md">Code Explanation</Text>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      Explains how code works in clear, simple terms
                    </Text>
                    <Text fontSize="xs" mt={1} fontStyle="italic" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
                      "Explain how user registration works" or "What does the database connection code do?"
                    </Text>
                  </Box>
                </Flex>

                <Flex 
                  p={4} 
                  borderRadius="md" 
                  borderWidth="1px" 
                  alignItems="flex-start" 
                  gap={3}
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                  cursor="pointer"
                  _hover={{ 
                    bg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
                    borderColor: colorMode === 'dark' ? 'purple.500' : 'purple.300', 
                  }}
                  onClick={() => handlePromptSelect("Search for code that handles file uploads")}
                >
                  <Icon as={FiSearch} mt={1} color={colorMode === 'dark' ? 'purple.300' : 'purple.500'} />
                  <Box>
                    <Text fontWeight="bold" fontSize="md">Code Search</Text>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      Find specific functionality in your codebase
                    </Text>
                    <Text fontSize="xs" mt={1} fontStyle="italic" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
                      "Find code for user authentication" or "Where is the database schema defined?"
                    </Text>
                  </Box>
                </Flex>

                <Flex 
                  p={4} 
                  borderRadius="md" 
                  borderWidth="1px" 
                  alignItems="flex-start" 
                  gap={3}
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                  cursor="pointer"
                  _hover={{ 
                    bg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
                    borderColor: colorMode === 'dark' ? 'green.500' : 'green.300', 
                  }}
                  onClick={() => handlePromptSelect("How can I optimize the database queries?")}
                >
                  <Icon as={FiZap} mt={1} color={colorMode === 'dark' ? 'green.300' : 'green.500'} />
                  <Box>
                    <Text fontWeight="bold" fontSize="md">Code Optimization</Text>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      Improve code performance and quality
                    </Text>
                    <Text fontSize="xs" mt={1} fontStyle="italic" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
                      "How can I optimize this function?" or "Make this code more maintainable"
                    </Text>
                  </Box>
                </Flex>
                
                <Flex 
                  p={4} 
                  borderRadius="md" 
                  borderWidth="1px" 
                  alignItems="flex-start" 
                  gap={3}
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                  cursor="pointer"
                  _hover={{ 
                    bg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
                    borderColor: colorMode === 'dark' ? 'purple.500' : 'purple.300', 
                  }}
                  onClick={() => handlePromptSelect("Write a function to calculate mean, median, and mode without using the statistics library")}
                >
                  <Icon as={FiCode} mt={1} color={colorMode === 'dark' ? 'purple.300' : 'purple.500'} />
                  <Box>
                    <Text fontWeight="bold" fontSize="md">Code Generation</Text>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      Creates new code based on descriptions
                    </Text>
                    <Text fontSize="xs" mt={1} fontStyle="italic" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
                      "Write a function to validate email addresses" or "Create a React component for a file upload form"
                    </Text>
                  </Box>
                </Flex>
              </Flex>
            </Flex>
          ) : (
            messages.map((msg, idx) => (
              <Flex
                key={idx}
                mb={4}
                justify={msg.type === 'user' ? 'flex-end' : 'flex-start'}
                className="message-animation"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {msg.type === 'llm' && (
                  <Avatar 
                    size="sm" 
                    icon={<FiCode fontSize="1.5rem" />} 
                    bg={colorMode === 'dark' ? 'blue.600' : 'blue.100'} 
                    color={colorMode === 'dark' ? 'white' : 'blue.800'}
                    mr={2}
                  />
                )}
                <Box
                  maxW="75%"
                  bg={msg.type === 'user' ? userBubbleBg : llmBubbleBg}
                  color={colorMode === 'dark' ? 'white' : 'gray.800'}
                  p={3}
                  borderRadius="lg"
                  boxShadow="sm"
                  borderTopLeftRadius={msg.type === 'llm' ? '2px' : undefined}
                  borderTopRightRadius={msg.type === 'user' ? '2px' : undefined}
                >
                  {msg.type === 'llm' ? (
                    <Box className="markdown-block">
                      <MarkdownRenderer content={msg.text} />
                    </Box>
                  ) : (
                    <Text>{msg.text}</Text>
                  )}
                </Box>
                {msg.type === 'user' && (
                  <Avatar 
                    size="sm" 
                    ml={2}
                    icon={<FiUser fontSize="1.5rem" />}
                    bg={colorMode === 'dark' ? 'green.600' : 'green.100'} 
                    color={colorMode === 'dark' ? 'white' : 'green.800'}
                  />
                )}
              </Flex>
            ))
          )}
          <div ref={chatEndRef} />
        </Box>
      </Panel>

      <HorizontalResizeHandle />

      <Panel defaultSize={25} minSize={29} maxSize={50} className="input-section">
        <div className="resizable-section p-2 h-full flex">
          <Box h="100%" w="100%" p={4}>
            <SearchInput onSend={handleSendMessage} />
          </Box>
        </div>
      </Panel>
    </PanelGroup>
  );
};