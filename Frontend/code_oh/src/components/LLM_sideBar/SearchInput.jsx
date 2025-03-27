import React, { useState, useRef, useEffect } from 'react';

// Query suggestions based on query type
const QUERY_SUGGESTIONS = {
  search: [
    "Find database connections",
    "Show authentication code",
    "Where are API endpoints defined?"
  ],
  explain: [
    "Explain this code",
    "How does error handling work?",
    "What does this component do?"
  ],
  optimize: [
    "Optimize this function",
    "Make this query more efficient",
    "Better way to implement this?"
  ],
  generate: [
    "Write a utility for email validation",
    "Create a helper function for date formatting",
    "Generate a React form component"
  ],
  modify: [
    "Modify file @config.js to add new settings",
    "Create a new file called helpers.js",
    "Update @README.md with setup instructions",
    "Add error handling to @app.js"
  ],
  general: [
    "Project structure overview",
    "Best way to add new features?",
    "Common patterns in this codebase"
  ]
};

const SearchInput = ({ onSend, isLoading, queryType = 'general' }) => {
  const [userMessage, setUserMessage] = useState('');
  const textareaRef = useRef(null);

  // Handle auto-resizing textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight > 100 ? '100px' : `${scrollHeight}px`;
    }
  }, [userMessage]);

  const handleSubmit = () => {
    if (userMessage.trim() && !isLoading) {
      onSend(userMessage); // pass to parent
      setUserMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Get suggestions based on current query type
  const getSuggestions = () => {
    return QUERY_SUGGESTIONS[queryType] || QUERY_SUGGESTIONS.general;
  };
  
  // Icons for query types
  const getQueryTypeIcon = () => {
    switch(queryType) {
      case 'search': return '🔍';
      case 'explain': return '📝';
      case 'optimize': return '⚡';
      case 'generate': return '✨';
      case 'modify': return '📄';
      default: return '💬';
    }
  };

  return (
    <div className="container_chat_bot flex flex-grow">
      {/* Main chat container with glow effect */}
      <div className="container-chat-options flex flex-grow min-h-0">
        <div className="glow" />
        <div className="chat">
          {/* Query type indicator */}
          {userMessage.length > 0 && queryType && (
            <div className="query-type-indicator" data-type={queryType}>
              <span className="query-icon">{getQueryTypeIcon()}</span>
              <span className="query-label">{queryType.charAt(0).toUpperCase() + queryType.slice(1)}</span>
            </div>
          )}
          
          {/* Text input area */}
          <div className="chat-bot flex-grow">
            <textarea
              ref={textareaRef}
              id="chat_bot"
              name="chat_bot"
              placeholder="Ask me about your code or modify files using @filename..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="chat-textarea"
            />
          </div>

          {/* Action buttons container */}
          <div className="options h-full">
            {/* Utility buttons */}
            <div className="btns-add">
              {/* Voice button */}
              <button disabled={isLoading} className="action-button" title="Voice input">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z" />
                  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                </svg>
              </button>

              {/* Upload button */}
              <button disabled={isLoading} className="action-button" title="Upload file">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
              </button>
            </div>

            {/* Submit button */}
            <button 
              className={`btn-submit ${isLoading ? 'disabled' : ''}`} 
              onClick={handleSubmit}
              disabled={isLoading || !userMessage.trim()}
              title="Send message"
            >
              <i>
                <svg viewBox="0 0 512 512" className="send-icon">
                  <path fill="currentColor" d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/>
                </svg>
              </i>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic query suggestions based on detected type */}
      <div className="tags">
        {getSuggestions().map((suggestion, index) => (
          <span 
            key={index}
            onClick={() => !isLoading && setUserMessage(suggestion)}
            className={
              queryType === 'generate' ? 'tag-generate' : 
              queryType === 'modify' ? 'tag-modify' : ''
            }
          >
            {suggestion}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SearchInput;