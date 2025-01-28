import React, { createContext, useState, useContext } from 'react';
import 'primereact/resources/themes/saga-blue/theme.css'; // Theme CSS
import 'primereact/resources/primereact.min.css';         // Core CSS
import 'primeicons/primeicons.css';                      // Icons



const FileContext = createContext();

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);

  return (
    <FileContext.Provider value={{ 
      files, 
      setFiles, 
      activeFile, 
      setActiveFile,
    }}>
      {children}
    </FileContext.Provider>
  );
};