import { Box, Text, Input, VStack, useColorMode } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'
import { useState, useRef, useEffect } from 'react'

export const ConsoleOutput = () => {
    const { colorMode } = useColorMode()
    const { handleConsoleInput, consoleHistory } = useEditor()
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef(null)

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            if (handleConsoleInput) {
                await handleConsoleInput(inputValue)
            }
            setInputValue('')
        }
    }

    useEffect(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [consoleHistory])

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
                {consoleHistory.map((entry, index) => (
                    <Text 
                        key={index} 
                        color={entry.type === 'input' ? 'green.500' : entry.type === 'error' ? 'red.500' : 'inherit'}
                        whiteSpace="pre-wrap"
                        fontFamily="monospace"
                    >
                        {entry.type === 'input' ? `> ${entry.content}` : entry.content}
                    </Text>
                ))}

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