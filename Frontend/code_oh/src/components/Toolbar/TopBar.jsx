import { Box, Code, HStack, IconButton, useColorMode, Image, Spacer } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'

export const TopBar = ({ toggleLLM, isLLMOpen }) => {
    const { colorMode } = useColorMode()
    const { runCode, isLoading } = useEditor()
    
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
                <Spacer />
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
                    isLoading={isLoading}
                    _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
                    }}
                />
                <IconButton
                    icon={
                        <Image 
                            src="https://cdn-icons-png.flaticon.com/512/8637/8637099.png" 
                            alt="AI Assistant" 
                            boxSize="20px"
                        />
                    }
                    aria-label="Toggle AI Assistant"
                    size="sm"
                    variant={isLLMOpen ? "solid" : "ghost"}
                    onClick={toggleLLM}
                    _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
                    }}
                />
            </HStack>
        </Box>
    )
}