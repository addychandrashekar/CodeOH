import { Box, Code, HStack, IconButton, useColorMode } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'

export const TopBar = () => {
    const { colorMode } = useColorMode()
    const { runCode } = useEditor()
    
    return (
        <Box 
            gridArea='top'
            bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
            h="40px"
            display="flex"
            alignItems="center"
            px={4}
        >
            <HStack spacing={4} width="100%">
                <Code fontSize="md">Code-OH</Code>
                <IconButton
                    icon={
                        <span 
                            className="material-symbols-outlined"
                            style={{ 
                                fontSize: '28px',
                                color: colorMode === 'dark' ? 'white' : 'black',
                                fontVariationSettings: "'FILL' 1"
                            }}
                        >
                            play_circle
                        </span>
                    }
                    aria-label="Run code"
                    size="sm"
                    variant="ghost"
                    onClick={runCode}
                    _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
                    }}
                />
            </HStack>
        </Box>
    )
}