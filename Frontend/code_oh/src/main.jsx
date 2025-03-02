import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './utils/theme.js'
import { FileProvider } from './context/FileContext'
import { EditorProvider } from './context/EditorContext'
import './styles/global.css'
import { KindeProvider } from "@kinde-oss/kinde-auth-react";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
      logoutUri={import.meta.env.VITE_KINDE_LOGOUT_URL}
      redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URL}
    >
      <ChakraProvider theme={theme}>
        <FileProvider>
          <EditorProvider>
            <App />
          </EditorProvider>
        </FileProvider>
      </ChakraProvider>
    </KindeProvider>

  </StrictMode>,
)