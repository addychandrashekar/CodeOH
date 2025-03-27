import { Box, useColorMode } from '@chakra-ui/react'
import React, { useState, useEffect } from 'react'
import { CodeEditor } from './components/Editor/CodeEditor'
import { FileExplorer } from './components/Sidebar/FileExplorer'
import { LLMExplorer } from './components/LLM_sideBar/LLMExplorer'
import { TopBar } from './components/Toolbar/TopBar'
import { ConsoleOutput } from './components/Console/ConsoleOutput'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import Loader from './components/Loading/Loader'
import { THEME_CONFIG } from './configurations/config'
import { motion, AnimatePresence } from 'framer-motion'
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { BACKEND_API_URL } from './services/BackendServices'
import 'primereact/resources/themes/saga-blue/theme.css'; 
import 'primereact/resources/primereact.min.css';         
import 'primeicons/primeicons.css';


/**
 * Main application component that provides the layout and structure for the code editor.
 * Features a resizable panel layout with file explorer, code editor, console output,
 * and optional AI assistant panel. Includes a loading screen on initial render.
 * 
 * @component
 * @returns {JSX.Element} The main application interface
 */
function App() {
  const { colorMode } = useColorMode()
  const [isLLMOpen, setIsLLMOpen] = useState(false)
  const [isLoadingContent, setIsLoading] = useState(true)

  const { 
    isLoading,
    isAuthenticated,
    login,

    user
  } = useKindeAuth();


  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      login();
    } else if (isAuthenticated && user?.id) {
      setIsLoading(false);
      
      // use the backend api in the backend services file
      fetch(`${BACKEND_API_URL}/api/auth/user`, {  // backend URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }), // Send user ID
      })
      .then(response => response.json())
      .then(data => {
        console.log("User ID sent successfully:", data);
      })
      .catch(error => {
        console.error("Error sending user ID:", error);
      });
    }
  }, [isLoading, isAuthenticated, user]);

  // view user id
  console.log(user?.id);

  /**
   * Vertical resize handle component for panel resizing
   * @returns {JSX.Element} A vertical resize handle with theme-aware styling
   */
  const ResizeHandle = () => (
    <PanelResizeHandle
      style={{
        width: '4px',
        background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
        cursor: 'col-resize'
      }}
    />
  )

  /**
   * Horizontal resize handle component for panel resizing
   * @returns {JSX.Element} A horizontal resize handle with theme-aware styling
   */
  const HorizontalResizeHandle = () => (
    <PanelResizeHandle
      style={{
        height: '4px',
        background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
        cursor: 'row-resize'
      }}
    />
  )

  // Show loader while loading
  if (isLoadingContent) {
    return (
      <Box 
        h="100vh" 
        w="100vw" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader />
        </motion.div>
      </Box>
    )
  }

  // Main application layout
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
    <Box 
      style={{
        opacity: isLoadingContent ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out'
      }}
      h="100vh" 
      overflow="hidden"
    >
      <PanelGroup direction="horizontal">
        {/* File Explorer Panel */}
        <Panel defaultSize={20} minSize={10} maxSize={40}>
          <Box h="100%" bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}>
            <FileExplorer />
          </Box>
        </Panel>

        <ResizeHandle />
      
        {/* Main Editor and Console Panel */} 
        <Panel>
          <Box h="100%" display="flex" flexDirection="column">
            <Box h="40px">
              <TopBar toggleLLM={() => setIsLLMOpen(!isLLMOpen)} isLLMOpen={isLLMOpen} />
            </Box>

            {/* Editor and Console Area */}
            <Box flex="1">
              <PanelGroup direction="vertical">
                <Panel defaultSize={60}>
                  <Box h="100%" bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}>
                    <CodeEditor />
                  </Box>
                </Panel>

                <HorizontalResizeHandle />

                <Panel defaultSize={40} minSize={10} maxSize={90}>
                  <ConsoleOutput />
                </Panel>
              </PanelGroup>
            </Box>
          </Box>
        </Panel>
        {/* Optional AI Assistant Panel */}
        <AnimatePresence>
          {isLLMOpen && (
            <>
              <ResizeHandle />
              <Panel defaultSize={20} minSize={20} maxSize={40}>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: '100%' }}
                >
                  <Box h="100%" bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}>
                    <LLMExplorer userId={user?.id}/>
                  </Box>
                </motion.div>
              </Panel>
            </>
          )}
        </AnimatePresence>
      </PanelGroup>
      </Box>
    </motion.div>
  )
}

export default App