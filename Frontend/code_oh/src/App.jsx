import { Box, Code, Grid, useColorMode } from '@chakra-ui/react'
import React from 'react'
import { CodeEditor } from './components/Editor/CodeEditor'

// import file explorer
import { FileExplorer } from './components/Sidebar/FileExplorer'
import { useFiles } from './context/FileContext'
import { TopBar } from './components/Toolbar/TopBar'
import { ConsoleOutput } from './components/Console/ConsoleOutput'

function App() {
  const { colorMode } = useColorMode()
  const { activeFile } = useFiles()

  return (
    <Grid
      templateAreas={`
        "sidebar top"
        "sidebar main"
        "sidebar console"
      `}
      gridTemplateRows={'30px 1fr 200px'}
      gridTemplateColumns={'250px 1fr'}
      h="100vh"
      gap='1'
      bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      color={colorMode === 'dark' ? 'white' : 'black'}
    >
      {/* Sidebar */}
      <Box
        gridArea='sidebar'
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
        // borderRight="1px"
        // borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        <FileExplorer />
      </Box>

      {/* Top bar */}
      <TopBar />

      {/* Main Editor Area */}
      <Box 
        gridArea='main'
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
        borderBottom="1px"
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        <CodeEditor />
      </Box>

      {/* Console Area */}
      <ConsoleOutput />
    </Grid>
  )
}

export default App
