import React from 'react';
import '../../styles/searchInput.css';

/**
 * SearchInput component that provides a chat-like interface for AI interactions.
 * Features a textarea for input, utility buttons, and quick action tags.
 * Styled with a custom CSS file for a modern, glowing effect design.
 * 
 * @component
 * @returns {JSX.Element} A chat interface with input area, action buttons, and tags
 */
const SearchInput = () => {
  return (
    <div className="wrapper">
      <div className="container_chat_bot">
        {/* Main chat container with glow effect */}
        <div className="container-chat-options">
          <div className="glow" />
          <div className="chat">
            {/* Text input area */}
            <div className="chat-bot">
              <textarea 
                id="chat_bot" 
                name="chat_bot" 
                placeholder="Imagine Something...✦˚" 
                defaultValue={""} 
              />
            </div>
            {/* Action buttons container */}
            <div className="options">
              {/* Utility buttons (attach, add, globe) */}
              <div className="btns-add">
                {/* Attachment button */}
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" />
                  </svg>
                </button>
                {/* Add button */}
                <button>
                  <svg viewBox="0 0 24 24" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" fill="none" />
                  </svg>
                </button>
                {/* Globe button */}
                <button>
                  <svg viewBox="0 0 24 24" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.01 8.01 0 0 0 5.648 6.667M10.03 13c.151 2.439.848 4.73 1.97 6.752A15.9 15.9 0 0 0 13.97 13zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.01 8.01 0 0 0 19.938 13M4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.01 8.01 0 0 0 4.062 11m5.969 0h3.938A15.9 15.9 0 0 0 12 4.248A15.9 15.9 0 0 0 10.03 11m4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.01 8.01 0 0 0-5.648-6.667" fill="currentColor" />
                  </svg>
                </button>
              </div>
              {/* Submit button */}
              <button className="btn-submit">
                <i>
                  <svg viewBox="0 0 512 512">
                    <path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" />
                  </svg>
                </i>
              </button>
            </div>
          </div>
        </div>
        {/* Quick action tags */}
        <div className="tags">
          <span>Create An Image</span>
          <span>Analyse Data</span>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default SearchInput;