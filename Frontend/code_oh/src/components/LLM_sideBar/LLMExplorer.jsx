import { Box, useColorMode, Button, HStack, Text, Tooltip, useToast } from '@chakra-ui/react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "../../styles/searchInput.css";
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SearchInput from './SearchInput';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BACKEND_API_URL } from '../../services/BackendServices';
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
            style={tomorrow}
            PreTag="div" 
            customStyle={{ borderRadius: '8px' }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    }}
  />
);

// Move getFileModificationExamples here, before it's used
const getFileModificationExamples = () => {
  return [
    "Modify file @app.py to add logging",
    "Create a new file called utils.py with helper functions",
    "Update the README.md file with installation instructions",
    "Add error handling to @main.js"
  ];
};

// Query examples for each type
const QUERY_EXAMPLES = {
  search: [
    "Find code that handles authentication",
    "Show me all database queries",
    "Where is the user profile logic?"
  ],
  explain: [
    "Explain how the authentication flow works",
    "What does this function do?",
    "Help me understand this algorithm"
  ],
  optimize: [
    "Optimize this database query",
    "Suggest improvements for this function",
    "How can I make this code more efficient?"
  ],
  generate: [
    "Write a function to validate email addresses",
    "Create a React component for a user profile",
    "Implement a cache system for API responses"
  ],
  general: [
    "What is this repository about?",
    "Best practices for organizing React components",
    "Explain the project structure"
  ],
  modify: getFileModificationExamples()
};

export const LLMExplorer = ({ userId }) => {
  const { colorMode } = useColorMode();
  const { files, setFiles } = useFiles();
  const toast = useToast();

  // State to track chat messages
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryType, setQueryType] = useState('');
  
  // State for file modification
  const [pendingFileModification, setPendingFileModification] = useState(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Debug useEffect for pendingFileModification
  useEffect(() => {
    if (pendingFileModification) {
      console.log("Pending file modification updated:", pendingFileModification);
      console.log("Showing confirmation UI for:", pendingFileModification.filename);
    }
  }, [pendingFileModification]);

  const HorizontalResizeHandle = () => (
    <PanelResizeHandle
      style={{
        height: '4px',
        background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
        cursor: 'row-resize'
      }}
    />
  );

  // Function to detect query type from user message
  const detectQueryType = (message) => {
    const msg = message.toLowerCase();
    
    // Add file modification detection
    if (/@\w+/.test(message) || /modify file|edit file|update file|create file|make a file/.test(msg)) {
      return 'modify';
    }
    
    // Simple detection based on keywords
    if (/find|search|show me|where is|code for|looking for/.test(msg)) {
      return 'search';
    } else if (/explain|how does|what does|understand|describe|tell me about/.test(msg)) {
      return 'explain';
    } else if (/optimize|improve|better way|refactor|performance/.test(msg)) {
      return 'optimize';
    } else if (/create|generate|write|implement|build a|make a|new function/.test(msg)) {
      return 'generate';
    } else {
      return 'general';
    }
  };

  // Function to handle file modification confirmation
  const handleFileModification = async (confirmed) => {
    if (!pendingFileModification) {
      console.error("No pending file modification found when trying to confirm/cancel");
      return;
    }
    
    console.log(`File modification ${confirmed ? 'confirmed' : 'cancelled'} for file: ${pendingFileModification.filename}`);
    console.log(`File content length: ${pendingFileModification.content.length}`);
    
    // Add a confirmation or cancellation message
    const confirmMsg = confirmed 
      ? "✅ I'll apply those changes right away."
      : "❌ File modification cancelled.";
      
    setMessages(prev => [...prev, { type: 'llm', text: confirmMsg }]);
    
    if (confirmed) {
      setIsLoading(true);
      console.log("Sending file modification request to backend...");
      
      const requestData = {
        file_data: pendingFileModification,
        user_id: userId,
        confirmed: true
      };
      
      console.log("File modification request data:", requestData);
      
      try {
        console.log(`Sending request to: ${BACKEND_API_URL}/apply_file_modification`);
        const res = await axios.post(`${BACKEND_API_URL}/apply_file_modification`, requestData);
        
        console.log("File modification response:", res.data);
        
        // Add success message
        const successMsg = `Successfully ${pendingFileModification.is_new_file ? 'created' : 'modified'} file: ${pendingFileModification.filename}`;
        setMessages(prev => [...prev, { type: 'llm', text: successMsg }]);
        
        // Refresh the file list to show the new file in the UI
        console.log("Refreshing file list to show the new file");
        setTimeout(async () => {
          try {
            console.log("Fetching updated files from backend");
            const response = await fetch(`${BACKEND_API_URL}/api/files?userId=${userId}`);
            if (response.ok) {
              const data = await response.json();
              // Extract the children from the default project
              const filesWithoutDefault = data.files?.[0]?.children || [];
              console.log("Retrieved updated files:", filesWithoutDefault);
              setFiles(filesWithoutDefault);
              
              toast({
                title: "File added to explorer",
                description: `${pendingFileModification.filename} is now available in your file explorer`,
                status: "success",
                duration: 3000,
                isClosable: true,
              });
            } else {
              console.error("Error fetching updated files");
            }
          } catch (error) {
            console.error("Failed to refresh files:", error);
          }
        }, 1000); // Add a slight delay to ensure database processing is complete
        
      } catch (error) {
        console.error('Error applying file modification:', error);
        console.error('Error details:', error.response?.data || 'No response data');
        setMessages(prev => [...prev, { 
          type: 'llm', 
          text: '⚠️ Error applying file changes: ' + (error.response?.data?.error || error.message) 
        }]);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Clear pending modification
    console.log("Clearing pending file modification");
    setPendingFileModification(null);
  };

  // Function passed to SearchInput to handle sending user messages
  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    // If the user responds "yes" or "confirm" to a pending file modification, treat it as confirmation
    if (pendingFileModification && 
        (userMessage.toLowerCase().includes('yes') || 
         userMessage.toLowerCase().includes('confirm') ||
         userMessage.toLowerCase().includes('allow'))) {
      console.log("User confirmed file modification via text response");
      // Handle as confirmation
      handleFileModification(true);
      return;
    }
    
    // If the user responds "no" or "cancel" to a pending file modification, treat it as cancellation
    if (pendingFileModification && 
        (userMessage.toLowerCase().includes('no') || 
         userMessage.toLowerCase().includes('cancel') ||
         userMessage.toLowerCase().includes('reject'))) {
      console.log("User cancelled file modification via text response");
      // Handle as cancellation
      handleFileModification(false);
      return;
    }

    // Extract the requested filename if it's in the format "create a new file called X"
    // or similar patterns, to ensure we're using the right filename
    let requestedFilename = null;
    const filenamePatterns = [
      /create\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+)?(\S+)(?:\s|$|\.)/i,  // "create a file sub.py"
      /new\s+file\s+(?:called\s+)?(\S+)(?:\s|$|\.)/i,
      /file\s+called\s+(\S+)(?:\s|$|\.)/i,
      /file\s+(\S+)(?:\s|that)/i  // "file sub.py that..."
    ];
    
    for (const pattern of filenamePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        requestedFilename = match[1];
        // Remove any trailing punctuation
        requestedFilename = requestedFilename.replace(/[.,;:]$/, '');
        console.log("Detected requested filename:", requestedFilename);
        break;
      }
    }
    
    // If no filename was detected through patterns but the message contains references
    // to creating a file and has words that could be filenames
    if (!requestedFilename && 
        /create|make|write|new/.test(userMessage.toLowerCase()) && 
        /file|py|js|txt/.test(userMessage.toLowerCase())) {
      
      // Look for potential filenames with extensions
      const extensionMatch = userMessage.match(/\b([a-zA-Z0-9_-]+\.(py|js|jsx|ts|tsx|html|css|md|txt|json))\b/);
      if (extensionMatch) {
        requestedFilename = extensionMatch[1];
        console.log("Detected filename by extension:", requestedFilename);
      }
    }

    // Detect query type
    const type = detectQueryType(userMessage);
    setQueryType(type);
    console.log(`Detected query type: ${type}`);
    
    if (type === 'modify') {
      console.log("File modification query detected:", userMessage);
    }

    // Optimistically add user message to chat
    const newMessages = [...messages, { type: 'user', text: userMessage }];
    setMessages(newMessages);
    
    // Show loading state
    setIsLoading(true);

    try {
      console.log(`Sending message to backend: ${userMessage}`);
      const res = await axios.post(`${BACKEND_API_URL}/chat`, {
        user_message: userMessage,
        user_id: userId
      });

      // Extract response data
      const responseData = res.data;
      console.log("Backend response:", responseData);
      
      const llmReply = responseData.response;
      const backendQueryType = responseData.query_type;
      
      console.log(`Backend query type: ${backendQueryType}`);
      
      // Check if this is a file modification request that needs confirmation
      if (backendQueryType === 'file_modification') {
        console.log("Backend classified this as a file modification request");
        
        if (llmReply.file_data) {
          console.log("File modification data received:", llmReply.file_data);
          
          // If we detected a specific filename request, override what the LLM may have chosen
          if (requestedFilename && llmReply.file_data) {
            console.log(`Overriding LLM filename '${llmReply.file_data.filename}' with requested filename '${requestedFilename}'`);
            
            // Store the old filename for log messages
            const oldFilename = llmReply.file_data.filename;
            
            // Update the filename in the file_data object
            llmReply.file_data.filename = requestedFilename;
            
            // Also update the display text to use the correct filename
            let fileText = llmReply.text;
            
            // Replace filename in the text between backticks `filename`
            fileText = fileText.replace(/`[^`]+`/, `\`${requestedFilename}\``);
            
            // Also replace any mentions of the old filename in the explanation text
            if (oldFilename !== requestedFilename) {
              const filenameWithoutExt = oldFilename.split('.')[0];
              const newFilenameWithoutExt = requestedFilename.split('.')[0];
              
              // Replace mentions of the old filename in the text (with care to not replace partial matches)
              const oldFileRegex = new RegExp(`\\b${filenameWithoutExt}\\b`, 'g');
              fileText = fileText.replace(oldFileRegex, newFilenameWithoutExt);
            }
            
            llmReply.text = fileText;
            
            console.log(`Final filename that will be created: '${llmReply.file_data.filename}'`);
          } else if (!requestedFilename) {
            console.log("No requested filename detected in user query");
          }
          
          setPendingFileModification(llmReply.file_data);
        } else {
          console.error("Backend reported file_modification but no file_data was provided");
        }
      }
      
      setMessages([...newMessages, { type: 'llm', text: llmReply.text || llmReply }]);
    } catch (error) {
      console.error('Error sending message to backend:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      setMessages([...newMessages, { type: 'llm', text: '⚠️ Error from LLM response' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get random example for a category
  const getRandomExample = (category) => {
    const examples = QUERY_EXAMPLES[category];
    return examples[Math.floor(Math.random() * examples.length)];
  };

  return (
    <PanelGroup direction="vertical">
      <Panel defaultSize={75} minSize={20} maxSize={90}>
        <div className="chat-history w-full h-full flex flex-col p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400 welcome-container">
                <div className="mb-4 welcome-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.8 3.1c-.4-.4-1-.4-1.4 0l-1.1 1.1c-1.3-1-3-1.7-4.8-1.7C8.5 2.5 4.5 6.5 4.5 11.5s4 9 9 9 9-4 9-9c0-1.8-.6-3.5-1.7-4.8l1.1-1.1c.4-.4.4-1 0-1.4zM13.5 18.5c-3.9 0-7-3.1-7-7s3.1-7 7-7c1.6 0 3 .5 4.2 1.4L9.3 14.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3l8.4-8.4c.9 1.2 1.4 2.6 1.4 4.2 0 3.9-3.1 7-7 7z" />
                    <path d="M14.5 10.5v-2c0-.6-.4-1-1-1s-1 .4-1 1v3c0 .3.1.5.3.7l2 2c.2.2.4.3.7.3.3 0 .5-.1.7-.3.4-.4.4-1 0-1.4l-1.7-1.7z" />
                  </svg>
                </div>
                <p className="text-xl font-medium mb-2">Ask me anything about your code</p>
                <p className="text-sm opacity-80 mb-4">I can help explain, optimize, debug, or generate code.</p>
                
                <div className="capabilities-section mt-6 text-left">
                  <p className="text-sm mb-3 text-gray-300">Try asking me to:</p>
                  
                  <div className="capability-examples grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="capability-card p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">🔍</span>
                        <strong>Find Code</strong>
                      </div>
                      <p className="example-query text-gray-400">
                        "{getRandomExample('search')}"
                      </p>
                    </div>
                    
                    <div className="capability-card p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">📝</span>
                        <strong>Explain Code</strong>
                      </div>
                      <p className="example-query text-gray-400">
                        "{getRandomExample('explain')}"
                      </p>
                    </div>
                    
                    <div className="capability-card p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">⚡</span>
                        <strong>Optimize Code</strong>
                      </div>
                      <p className="example-query text-gray-400">
                        "{getRandomExample('optimize')}"
                      </p>
                    </div>
                    
                    <div className="capability-card p-3 bg-gray-800 rounded-lg highlight">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">✨</span>
                        <strong>Generate Code</strong>
                      </div>
                      <p className="example-query text-gray-400">
                        "{getRandomExample('generate')}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-bubble ${
                    msg.type === 'user' ? 'user-bubble' : 'ai-bubble'
                  } ${msg.type === 'user' ? 'ml-auto' : 'mr-auto'}`}
                >
                  {msg.type === 'llm' ? (
                    <div className="markdown-block">
                      <MarkdownRenderer content={msg.text} />
                      {/* Add confirmation UI directly after a file modification message if there's a pending modification */}
                      {pendingFileModification && !isLoading && idx === messages.length - 1 && (
                        <div className="file-modification-confirmation mt-4">
                          <div className="mb-2 font-bold text-yellow-300">
                            ⚠️ File Operation Requires Confirmation
                          </div>
                          <HStack spacing={4} mt={2} mb={2}>
                            <Button 
                              size="md" 
                              colorScheme="green" 
                              onClick={() => handleFileModification(true)}
                            >
                              Allow
                            </Button>
                            <Button 
                              size="md" 
                              colorScheme="red" 
                              onClick={() => handleFileModification(false)}
                            >
                              Cancel
                            </Button>
                            <Text fontSize="sm" color="gray.300">
                              {pendingFileModification.is_new_file ? 'Create new file' : 'Modify existing file'}: 
                              <b> {pendingFileModification.filename}</b>
                            </Text>
                          </HStack>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="ai-bubble mr-auto">
              <div className="flex items-center space-x-3">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-sm">Code Oh is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </Panel>

      <HorizontalResizeHandle />

      <Panel defaultSize={25} minSize={29} maxSize={50} className="input-section">
        <div className="resizable-section p-2 h-full flex">
          <Box h="100%" w="100%" p={4}>
            <SearchInput onSend={handleSendMessage} isLoading={isLoading} queryType={queryType} />
          </Box>
        </div>
      </Panel>
    </PanelGroup>
  );
};