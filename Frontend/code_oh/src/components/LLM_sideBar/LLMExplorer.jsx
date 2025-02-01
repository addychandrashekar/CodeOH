import { 
    Box, 
    VStack, 
    HStack, 
    Text, 
    useColorMode,
} from '@chakra-ui/react'
import React from 'react'
import SearchInput from './SearchInput';


/**
 * LLMExplorer component that serves as a container for the AI chat interface.
 * Provides a full-height container for the SearchInput component with proper spacing.
 * 
 * @component
 * @returns {JSX.Element} A container box with the SearchInput component
 */
export const LLMExplorer = () => {
    // Theme context hook for color mode
    const { colorMode } = useColorMode()
    return (
        <Box
            h="100%"
            w="100%"
            p={4}
        >
            <SearchInput />
        </Box>
    );
}