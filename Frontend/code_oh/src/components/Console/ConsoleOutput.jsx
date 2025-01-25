import { Box, Text, useColorMode } from '@chakra-ui/react'
import { useEditor } from '../../context/EditorContext'

export const ConsoleOutput = () => {
    const { colorMode } = useColorMode()
    const { output, error } = useEditor()

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
        </Box>
    )
}