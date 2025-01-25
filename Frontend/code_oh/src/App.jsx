import { Box, Code, Grid, useColorMode } from '@chakra-ui/react'
import React from 'react'
import { CodeEditor } from './components/Editor/CodeEditor'

// import file explorer
import { FileExplorer } from './components/Sidebar/FileExplorer'
import { useFiles } from './context/FileContext'

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
      gridTemplateRows={'1fr auto'}
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
        p={4}
        borderRight="1px"
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        {/* Swap out "File Explorer" with your component */}
        <FileExplorer />
      </Box>

      {/* Top bar */}
      <Box 
        gridArea='top'
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
      >
        <Code>Code-Oh</Code>
      </Box>

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
      <Box 
        gridArea='console'
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
        p={4}
        h="200px"
        borderTop="1px"
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        Console Output
      </Box>
    </Grid>
  )
}

export default App
