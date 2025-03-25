import { Box, useColorMode } from '@chakra-ui/react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "../../styles/searchInput.css";
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SearchInput from './SearchInput';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { BACKEND_API_URL } from '../../services/BackendServices';

const MarkdownRenderer = ({ content }) => (
  <ReactMarkdown
    children={content}
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter language={match[1]} PreTag="div" {...props}>
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

export const LLMExplorer = ({ userId }) => {
  const { colorMode } = useColorMode();

  // State to track chat messages
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

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

  // Function passed to SearchInput to handle sending user messages
  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    console.log("Reached here??")

    // Optimistically add user message to chat
    const newMessages = [...messages, { type: 'user', text: userMessage }];
    setMessages(newMessages);

    try {
      const res = await axios.post(`${BACKEND_API_URL}/chat`, {
        user_message: userMessage,
        user_id: userId
      });

      const llmReply = res.data.response;
      setMessages([...newMessages, { type: 'llm', text: llmReply.text || llmReply }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, { type: 'llm', text: '⚠️ Error from LLM response' }]);
    }
  };

  return (
    <PanelGroup direction="vertical">
      <Panel defaultSize={75} minSize={20} maxSize={90}>
        <div className="overflow-y-auto styled-wrapper w-full h-full flex flex-col chat-section p-4">
        {messages.map((msg, idx) => (
            <div
                key={idx}
                className={`llm-bubble ${
                msg.type === 'user' ? 'ml-auto w-fit' : 'w-auto'
                } max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5`}
            >
                {msg.type === 'llm' ? (
                // LLM message -> render Markdown
                <MarkdownRenderer content={msg.text} />
                ) : (
                // User message -> just plain text
                <p>{msg.text}</p>
                )}
            </div>
            ))}
            
            <div ref={chatEndRef} />
        </div>
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