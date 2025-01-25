import { 
    Box, 
    VStack, 
    HStack, 
    Text, 
    useColorMode,
} from '@chakra-ui/react'
import React from 'react'

export const LLMExplorer = () => {
    const { colorMode } = useColorMode()

    return (
        <VStack
            align="stretch" 
            spacing={4} 
            h="calc(100vh - 32px)"
            overflowY="auto"
            p={2}
            css={{
                '&::-webkit-scrollbar': {
                    width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: colorMode === 'dark' ? 'gray.700' : 'gray.300',
                    borderRadius: '24px',
                },
            }}
        >
            <HStack justify="space-between" padding={2}>
                <Text fontSize="lg" fontWeight="bold">LLM Assistant</Text>
            </HStack>
        </VStack>
    )
}