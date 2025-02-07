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
  const [isLoading, setIsLoading] = useState(true)


  // Initialize loading state
  useEffect(() => {
    // Set a timer to hide the loader after LOADINGTIMER  seconds
    const timer = setTimeout(() => {
        setIsLoading(false)
    }, THEME_CONFIG.LOADING_TIMER)
    return () => clearTimeout(timer)
}, [])


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
  if (isLoading) {
    return (
      <Box 
        h="100vh" 
        w="100vw" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
      >
        <Loader />
      </Box>
    )
  }

  // Main application layout
  return (
    <Box 
      style={{
        opacity: isLoading ? 0 : 1,
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
        {isLLMOpen && (
          <>
            <ResizeHandle />
            <Panel defaultSize={20} minSize={10} maxSize={40}>
              <Box h="100%" bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}>
                <LLMExplorer />
              </Box>
            </Panel>
          </>
        )}
      </PanelGroup>
    </Box>
  )
}

export default App