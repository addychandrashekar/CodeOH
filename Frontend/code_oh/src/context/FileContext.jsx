import React, { createContext, useState, useContext } from 'react'



// FileProvider holds files (the array of all files) in React state.
// useFiles() is a convenience hook to access { files, setFiles }.
// Any component wrapped by FileProvider can access or update the files list.


// Create a context
const FileContext = createContext()

// Custom hook to consume the context
export const useFiles = () => {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
}

// Provider component
export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([])
  const [activeFile, setActiveFile] = useState(null)

  return (
    <FileContext.Provider value={{ files, setFiles, activeFile, setActiveFile }}>
      {children}
    </FileContext.Provider>
  )
}