import React, { createContext, useState, useContext } from 'react'



// FileProvider holds files (the array of all files) in React state.
// useFiles() is a convenience hook to access { files, setFiles }.
// Any component wrapped by FileProvider can access or update the files list.


// Create a context
const FileContext = createContext()

// Custom hook to consume the context
export const useFiles = () => {
  return useContext(FileContext)
}

// Provider component
export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([])

  return (
    <FileContext.Provider value={{ files, setFiles }}>
      {children}
    </FileContext.Provider>
  )
}