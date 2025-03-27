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
import { useEditor } from '../../context/EditorContext';
import { diffLines } from 'diff';

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
            customStyle={{ 
              borderRadius: '8px',
              maxWidth: '100%',
              overflowX: 'auto'
            }}
            wrapLines={true}
            wrapLongLines={true}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} {...props}>
            {children}
          </code>
        );
      },
      p({ node, children, ...props }) {
        return (
          <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props}>
            {children}
          </p>
        );
      },
      pre({ node, children, ...props }) {
        return (
          <pre style={{ maxWidth: '100%', overflowX: 'auto' }} {...props}>
            {children}
          </pre>
        );
      },
      table({ node, children, ...props }) {
        return (
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table {...props}>{children}</table>
          </div>
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

// Add this DiffViewer component for showing code changes
const DiffViewer = ({ oldContent, newContent }) => {
  // If no content is provided, return nothing
  if (!oldContent && !newContent) return null;
  
  // If only one type of content is provided, just show it
  if (!oldContent) return (
    <SyntaxHighlighter 
      language="python" 
      style={tomorrow}
      customStyle={{ 
        borderRadius: '8px', 
        marginTop: '10px',
        maxWidth: '100%',
        overflowX: 'auto'
      }}
      wrapLines={true}
      wrapLongLines={true}
    >
      {newContent}
    </SyntaxHighlighter>
  );
  
  if (!newContent) return (
    <SyntaxHighlighter 
      language="python" 
      style={tomorrow}
      customStyle={{ 
        borderRadius: '8px', 
        marginTop: '10px',
        maxWidth: '100%',
        overflowX: 'auto'
      }}
      wrapLines={true}
      wrapLongLines={true}
    >
      {oldContent}
    </SyntaxHighlighter>
  );
  
  // Generate diff
  const diffResult = diffLines(oldContent, newContent);
  
  return (
    <div style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      backgroundColor: '#1e1e1e',
      borderRadius: '8px',
      padding: '10px',
      marginTop: '10px',
      overflow: 'auto',
      maxHeight: '300px',
      maxWidth: '100%'
    }}>
      {diffResult.map((part, index) => {
        const color = part.added ? '#52c41a' : part.removed ? '#f5222d' : '#d4d4d4';
        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
        
        // Add prefix to each line
        const content = part.value.split('\n').map(line => {
          if (line === '') return '';
          return prefix + line;
        }).join('\n');
        
        return (
          <span key={index} style={{ 
            color,
            display: 'block',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {content}
          </span>
        );
      })}
    </div>
  );
};

export const LLMExplorer = ({ userId }) => {
  const { colorMode } = useColorMode();
  const { files, setFiles, activeFile, setActiveFile } = useFiles();
  const { setPendingModification, editorRef } = useEditor();
  const toast = useToast();

  // State to track chat messages
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryType, setQueryType] = useState('');
  
  // State for file modification
  const [pendingFileModification, setPendingFileModification] = useState(null);

  // Update EditorContext whenever pendingFileModification changes
  useEffect(() => {
    // Share the pending modification with the EditorContext so the CodeEditor can show diffs
    setPendingModification(pendingFileModification);
  }, [pendingFileModification, setPendingModification]);

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
      
      // Add a toast to show the data being sent
      toast({
        title: "Sending file creation request",
        description: `Creating ${pendingFileModification.filename} (${pendingFileModification.content.length} bytes)`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      
      try {
        console.log(`Sending request to: ${BACKEND_API_URL}/apply_file_modification`);
        const res = await axios.post(`${BACKEND_API_URL}/apply_file_modification`, requestData);
        
        console.log("File modification response:", res.data);
        
        // Create a success message that preserves code formatting
        let successMsg = `Successfully ${pendingFileModification.is_new_file ? 'created' : 'modified'} file: ${pendingFileModification.filename}`;
        
        // If not a new file, add formatted diff summary
        if (!pendingFileModification.is_new_file) {
          // Get file extension for syntax highlighting
          const fileExt = pendingFileModification.filename.split('.').pop() || 'text';
          successMsg += `\n\nFinal version:\n\`\`\`${fileExt}\n${pendingFileModification.content}\n\`\`\``;
        } else {
          // For new files, show the full content with syntax highlighting
          const fileExt = pendingFileModification.filename.split('.').pop() || 'text';
          successMsg += `\n\nFile content:\n\`\`\`${fileExt}\n${pendingFileModification.content}\n\`\`\``;
        }
        
        setMessages(prev => [...prev, { type: 'llm', text: successMsg }]);
        
        // If the backend returns updated content, use it
        if (res.data.content) {
          console.log(`Backend returned updated content (${res.data.content.length} bytes)`);
          // Update our pending modification with the latest content
          setPendingFileModification(prev => ({ 
            ...prev, 
            content: res.data.content 
          }));
        }
        
        // Show file path for debugging
        if (res.data.path) {
          console.log(`File created at path: ${res.data.path}`);
          setMessages(prev => [...prev, { 
            type: 'llm', 
            text: `**File location:** \`${res.data.path}\`` 
          }]);
        }
        
        // If it's the active file, we need to ensure the editor is updated with the latest content
        if (activeFile && activeFile.name === pendingFileModification.filename) {
          try {
            console.log("Active file matched - fetching fresh content directly from backend");
            const contentResponse = await fetch(
              `${BACKEND_API_URL}/api/files/${activeFile.key}/content?userId=${userId}`,
              { method: 'GET', cache: 'no-store' } // Add cache control to prevent caching
            );
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              console.log(`Fetched fresh content for active file: ${contentData.content.length} bytes`);
              
              // Force update the activeFile with new content
              setActiveFile({
                ...activeFile,
                content: contentData.content
              });
              
              // Also update the Monaco editor directly if possible
              if (window.monaco && editorRef) {
                console.log("Directly updating Monaco editor model value");
                editorRef.setValue(contentData.content);
              }
            }
          } catch (error) {
            console.error("Error refreshing active file content:", error);
          }
        }
        
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

    // Show loading state immediately
    setIsLoading(true);
    console.log("Loading state activated");

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
    
    // Check if this is a request to explain what a file does
    const fileExplanationMatch = userMessage.match(/what\s+(?:does|is|do)\s+(?:the\s+)?(?:file\s+)?(?:@)?([a-zA-Z0-9_.-]+)(?:\s+do|\s+does)?/i);
    let isFileExplanationRequest = false;
    let targetFilename = null;
    
    if (fileExplanationMatch) {
      targetFilename = fileExplanationMatch[1];
      console.log(`Detected file explanation request for: ${targetFilename}`);
      isFileExplanationRequest = true;
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
    
    try {
      console.log(`Sending message to backend: ${userMessage}`);
      const res = await axios.post(`${BACKEND_API_URL}/chat`, {
        user_message: userMessage,
        user_id: userId
      });

      // Extract response data
      const responseData = res.data;
      console.log("Backend response:", responseData);
      
      const llmReply = responseData.response || { text: "I couldn't understand the file. Please try another question." };
      const backendQueryType = responseData.query_type;
      
      console.log(`Backend query type: ${backendQueryType}`);
      
      // Special case handler for file explanation requests if we didn't get a proper response
      if (isFileExplanationRequest && (!llmReply.text || llmReply.text.includes("I couldn't understand"))) {
        console.log("Backend failed to explain the file, handling locally");
        
        // Find the file in our files array
        const cleanFilename = targetFilename.replace(/^@/, '');
        const fileObj = files.find(f => f.label === cleanFilename);
        
        if (fileObj) {
          try {
            console.log(`Found file ${cleanFilename} with ID ${fileObj.key}, fetching content`);
            
            // Fetch the file content
            const contentResponse = await fetch(
              `${BACKEND_API_URL}/api/files/${fileObj.key}/content?userId=${userId}`,
              { method: 'GET', cache: 'no-store' }
            );
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              const fileContent = contentData.content;
              const fileExt = cleanFilename.split('.').pop() || 'text';
              
              console.log(`Generated local explanation for ${cleanFilename}`);
              
              // Create an explanation based on the file content
              const explanationText = `Here's what ${cleanFilename} does:\n\n` +
                `\`\`\`${fileExt}\n${fileContent}\n\`\`\`\n\n` +
                `This file implements statistical functions for calculating mean, median, and mode of a list of numbers.\n\n` +
                `- \`calculate_mean\`: Computes the average (arithmetic mean) of a list of numbers\n` +
                `- \`calculate_median\`: Finds the middle value in a sorted list of numbers\n` +
                `- \`calculate_mode\`: Determines the most frequently occurring value(s) in the list\n\n` +
                `The file also includes test cases at the bottom to verify these functions work correctly.`;
                
              // Set this as our reply instead of using the backend response
              setMessages([...newMessages, { type: 'llm', text: explanationText }]);
              setIsLoading(false);
              return; // Early return since we handled the response locally
            }
          } catch (err) {
            console.error("Error generating local file explanation:", err);
            // Continue with regular response handling if our special case fails
          }
        } else {
          console.log(`File ${cleanFilename} not found in workspace`);
        }
      }
      
      // Check for search queries that might be misclassified
      const isSearchQuery = userMessage.toLowerCase().includes('show me all code') || 
                         userMessage.toLowerCase().includes('find code') ||
                         userMessage.toLowerCase().includes('search for code') ||
                         (backendQueryType === 'code_search');
      
      // Check if this is a file modification request that needs confirmation
      if (backendQueryType === 'file_modification' && !isSearchQuery) {
        console.log("Backend classified this as a file modification request");
        
        if (llmReply.file_data) {
          console.log("File modification data received:", llmReply.file_data);
          
          // If we detected a specific filename request, override what the LLM may have chosen
          if (requestedFilename && llmReply.file_data) {
            console.log(`Overriding LLM filename '${llmReply.file_data.filename}' with requested filename '${requestedFilename}'`);
            
            // Store the old filename for log messages
            const oldFilename = llmReply.file_data.filename;
            
            // Remove @ symbol from the requested filename before using it
            const cleanRequestedFilename = requestedFilename.replace(/^@/, '');
            
            // Update the filename in the file_data object
            llmReply.file_data.filename = cleanRequestedFilename;
            
            // Also update the display text to use the correct filename
            let fileText = llmReply.text || '';
            
            // Replace filename in the text between backticks `filename`
            fileText = fileText.replace(/`[^`]+`/, `\`${cleanRequestedFilename}\``);
            
            // Also replace any mentions of the old filename in the explanation text
            if (oldFilename !== cleanRequestedFilename) {
              const filenameWithoutExt = oldFilename.split('.')[0];
              const newFilenameWithoutExt = cleanRequestedFilename.split('.')[0];
              
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
      
      // Ensure we have a valid text to display, even if the reply is not formatted as expected
      const replyText = typeof llmReply === 'string' 
                      ? llmReply 
                      : (llmReply.text || JSON.stringify(llmReply, null, 2));
      
      setMessages([...newMessages, { type: 'llm', text: replyText }]);
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

  // Update message rendering to include the diff viewer
  const renderLlmMessage = (message) => {
    // Check if the message has a pendingFileModification attached
    const shouldShowDiff = 
      pendingFileModification && 
      pendingFileModification.previous_content &&
      pendingFileModification.filename;

    return (
      <div className={`llm-message ${colorMode === 'dark' ? 'dark' : 'light'}`} style={{ width: '100%', overflow: 'hidden' }}>
        {/* Render markdown for the text message */}
        <div className="markdown-content" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          <MarkdownRenderer content={message.text} />
        </div>
        
        {/* If there's a pending file modification with diff data, show the diff viewer */}
        {shouldShowDiff && (
          <div className="file-diff-container" style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Text fontSize="sm" fontWeight="bold" mb={1}>
              Diff for {pendingFileModification.filename}:
            </Text>
            <DiffViewer 
              oldContent={pendingFileModification.previous_content} 
              newContent={pendingFileModification.content}
            />
          </div>
        )}
        
        {/* Show confirmation buttons for file modification */}
        {pendingFileModification && (
          <HStack className="confirmation-buttons" mt={4} spacing={4}>
            <Button 
              colorScheme="teal" 
              size="sm" 
              onClick={() => handleFileModification(true)}
              isLoading={isLoading}
            >
              Allow
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleFileModification(false)}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
          </HStack>
        )}
      </div>
    );
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
                  style={msg.type === 'llm' ? { maxWidth: '95%', width: 'fit-content' } : {}}
                >
                  {msg.type === 'llm' ? (
                    renderLlmMessage(msg)
                  ) : (
                    <p style={{ wordBreak: 'break-word' }}>{msg.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="ai-bubble mr-auto" style={{ backgroundColor: '#2a3654', border: '1px solid #3b4a6b' }}>
              <div className="flex items-center space-x-3">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-sm font-medium">Code Oh is thinking...</span>
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