import { Box, Text, Input, VStack, useColorMode } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'
import { useState, useRef, useEffect } from 'react'


/**
 * ConsoleOutput component that provides a terminal-like interface for command input and output display.
 * Supports different types of entries (input, error, output) with appropriate styling.
 * Integrates with the EditorContext for command handling and history management.
 * 
 * @component
 * @returns {JSX.Element} A console interface with command history and input field
 */
export const ConsoleOutput = () => {
    // Theme and editor context hooks
    const { colorMode } = useColorMode()
    const { handleConsoleInput, consoleHistory } = useEditor()
    // Local state for input management
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef(null)

    /**
     * Handles keyboard input events, specifically the Enter key for command submission
     * @param {React.KeyboardEvent} e - The keyboard event object
     */
    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            if (handleConsoleInput) {
                await handleConsoleInput(inputValue)
            }
            setInputValue('')
        }
    }

    // Auto-scroll to the latest input when history updates
    useEffect(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [consoleHistory])

    /**
     * Determines the style for different types of console entries
     * @param {Object} entry - The console entry object
     * @param {('input'|'error'|'output')} entry.type - The type of console entry
     * @returns {Object} Style object for the entry
     */
    const getEntryStyle = (entry) => {
        // Base styling for all entry types
        const baseStyle = {
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "14px",
            padding: "2px 4px",
            borderRadius: "4px",
            marginBottom: "2px"
        }
        // Apply specific styles based on entry type
        switch (entry.type) {
            case 'input':
                return {
                    ...baseStyle,
                    color: colorMode === 'dark' ? '#98c379' : '#50a14f',
                    backgroundColor: colorMode === 'dark' ? 'rgba(152, 195, 121, 0.1)' : 'rgba(80, 161, 79, 0.1)'
                }
            case 'error':
                return {
                    ...baseStyle,
                    color: colorMode === 'dark' ? '#e06c75' : '#e45649',
                    backgroundColor: colorMode === 'dark' ? 'rgba(224, 108, 117, 0.1)' : 'rgba(228, 86, 73, 0.1)'
                }
            default:
                return {
                    ...baseStyle,
                    color: colorMode === 'dark' ? '#abb2bf' : '#383a42'
                }
        }
    }

    return (
        <Box 
            gridArea='console'
            bg={colorMode === 'dark' ? '#282c34' : '#fafafa'}
            p={4}
            h="100%"
            borderTop="1px"
            borderColor={colorMode === 'dark' ? '#3e4451' : '#e5e5e6'}
            overflowY="auto"
        >
            <VStack align="stretch" spacing={1}>
                {/* Display console history entries */}
                {consoleHistory.map((entry, index) => (
                    <Text 
                        key={index} 
                        sx={getEntryStyle(entry)}
                    >
                        {entry.type === 'input' ? (
                            <span>
                                <Text as="span" color={colorMode === 'dark' ? '#61afef' : '#4078f2'}>➜ </Text>
                                {entry.content}
                            </span>
                        ) : entry.content}
                    </Text>
                ))}
                {/* Command input field */}
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter command..."
                    bg="transparent"
                    border="none"
                    _focus={{ boxShadow: 'none' }}
                    spellCheck="false"
                    autoComplete="off"
                    color={colorMode === 'dark' ? '#abb2bf' : '#383a42'}
                    pl={2}
                    fontSize="14px"
                    fontFamily="monospace"
                    sx={{
                        '&::placeholder': {
                            color: colorMode === 'dark' ? '#5c6370' : '#a0a1a7'
                        }
                    }}
                />
            </VStack>
        </Box>
    )
}