import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './utils/theme.js'
import { ColorModeScript } from './utils/colorModeScript.jsx'
import { FileProvider } from './context/FileContext' 
import { EditorProvider } from './context/EditorContext' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeScript />
    <ChakraProvider theme={theme}>
      <FileProvider>
        <EditorProvider>
          <App />
        </EditorProvider>
      </FileProvider>
    </ChakraProvider>
  </StrictMode>,
)