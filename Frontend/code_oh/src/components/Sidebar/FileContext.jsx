import { createContext, useContext, useState } from 'react'

const FileContext = createContext()

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([])
  const [activeFile, setActiveFile] = useState(null)

  const value = {
    files,
    setFiles,
    activeFile,
    setActiveFile
  }

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  )
}

export const useFiles = () => {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
}