import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './utils/theme.js'
import { FileProvider } from './context/FileContext' 
import { EditorProvider } from './context/EditorContext' 
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <FileProvider>
        <EditorProvider>
          <App />
        </EditorProvider>
      </FileProvider>
    </ChakraProvider>
  </StrictMode>,
)