import { Box, Code, HStack, IconButton, useColorMode, Image, Spacer } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'


/**
 * TopBar component that provides the main toolbar interface for the application.
 * Contains the application title, code execution button, and AI assistant toggle.
 * Integrates with EditorContext for code execution and theme management.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.toggleLLM - Function to toggle the AI assistant panel
 * @param {boolean} props.isLLMOpen - Current state of the AI assistant panel
 * @returns {JSX.Element} A toolbar with application controls
 */
export const TopBar = ({ toggleLLM, isLLMOpen }) => {
    // Theme and editor context hooks
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
                {/* Application title */}
                <Code fontSize="md">Code-OH</Code>
                <Spacer />

                {/* Code execution button */}
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
                
                {/* AI Assistant toggle button */}
                <IconButton
                    icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="lightblue" class="bi bi-stars" viewBox="0 0 16 16">
                    <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
                    </svg>
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