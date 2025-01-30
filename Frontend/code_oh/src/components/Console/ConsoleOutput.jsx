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

    const getEntryStyle = (entry) => {
        const baseStyle = {
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "14px",
            padding: "2px 4px",
            borderRadius: "4px",
            marginBottom: "2px"
        }

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