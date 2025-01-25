import { Box, Code, Grid, useColorMode } from '@chakra-ui/react'
import React from 'react'
import { CodeEditor } from './components/Editor/CodeEditor'

// import file explorer
import { FileExplorer } from './components/Sidebar/FileExplorer'
import { useFiles } from './context/FileContext'
import { TopBar } from './components/Toolbar/TopBar'
import { ConsoleOutput } from './components/Console/ConsoleOutput'

// function App() {
//   const { colorMode } = useColorMode()
//   const { activeFile } = useFiles()

//   return (
//     <Grid
//       templateAreas={`
//         "sidebar top"
//         "sidebar main"
//         "sidebar console"
//       `}
//       gridTemplateRows={'30px 1fr 200px'}
//       gridTemplateColumns={'250px 1fr'}
//       h="100vh"
//       gap='1'
//       bg={colorMode === 'dark' ? 'gray.800' : 'white'}
//       color={colorMode === 'dark' ? 'white' : 'black'}
//     >
//       {/* Sidebar */}
//       <Box
//         gridArea='sidebar'
//         bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
//       >
//         <FileExplorer />
//       </Box>

//       {/* Top bar */}
//       <TopBar />

//       {/* Main Editor Area */}
//       <Box 
//         gridArea='main'
//         bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
//         borderBottom="1px"
//         borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
//       >
//         <CodeEditor />
//       </Box>

//       {/* Console Area */}
//       <ConsoleOutput />
//     </Grid>
//   )
// }

// export default App

import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels'

function App() {
  const { colorMode } = useColorMode()

  const ResizeHandle = () => (
    <PanelResizeHandle
      style={{
        width: '4px',
        background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
        cursor: 'col-resize'
      }}
    />
  )

  const HorizontalResizeHandle = () => (
    <PanelResizeHandle
      style={{
        height: '4px',
        background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
        cursor: 'row-resize'
      }}
    />
  )

  return (
    <Box h="100vh" overflow="hidden">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={10} maxSize={40}>
          <Box h="100%" bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}>
            <FileExplorer />
          </Box>
        </Panel>

        <ResizeHandle />

        <Panel>
          <Box h="100%" display="flex" flexDirection="column">
            <Box h="40px">
              <TopBar />
            </Box>

            <Box flex="1">
              <PanelGroup direction="vertical">
                <Panel defaultSize={75}>
                  <Box h="100%" bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}>
                    <CodeEditor />
                  </Box>
                </Panel>

                <HorizontalResizeHandle />

                <Panel defaultSize={25} minSize={10} maxSize={90}>
                  <ConsoleOutput />
                </Panel>
              </PanelGroup>
            </Box>
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  )
}

export default App