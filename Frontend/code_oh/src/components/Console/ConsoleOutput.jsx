import { Box, Text, Input, VStack, useColorMode } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'
import { useState, useRef, useEffect } from 'react'

export const ConsoleOutput = () => {
    const { colorMode } = useColorMode()
    const { output, error, handleConsoleInput } = useEditor()
    const [inputValue, setInputValue] = useState('')
    const [history, setHistory] = useState([])
    const inputRef = useRef(null)

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            // Add command to history
            setHistory(prev => [...prev, { type: 'input', content: inputValue }])
            
            // Process the command
            if (handleConsoleInput) {
                await handleConsoleInput(inputValue)
            }
            
            setInputValue('')
        }
    }

    // Auto-scroll to bottom when new content is added
    useEffect(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history, output, error])

    return (
        <Box 
            gridArea='console'
            bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
            p={4}
            h="100%"
            borderTop="1px"
            borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
            color={colorMode === 'dark' ? 'white' : 'black'}
            overflowY="auto"
        >
            <VStack align="stretch" spacing={2}>
                {/* History */}
                {history.map((entry, index) => (
                    <Text 
                        key={index} 
                        color={entry.type === 'input' ? 'green.500' : 'inherit'}
                        whiteSpace="pre-wrap"
                    >
                        {entry.type === 'input' ? `> ${entry.content}` : entry.content}
                    </Text>
                ))}
                
                {/* Current output/error */}
                {error && (
                    <Text color="red.500" whiteSpace="pre-wrap">
                        {error}
                    </Text>
                )}
                {output && (
                    <Text whiteSpace="pre-wrap">
                        {output}
                    </Text>
                )}

                {/* Input field */}
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
                    color={colorMode === 'dark' ? 'white' : 'black'}
                    pl={2}
                    fontSize="sm"
                    fontFamily="monospace"
                />
            </VStack>
        </Box>
    )
}