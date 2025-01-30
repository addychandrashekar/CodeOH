import { 
    Box, 
    VStack, 
    HStack, 
    Text, 
    useColorMode,
} from '@chakra-ui/react'
import React from 'react'
import SearchInput from './SearchInput';

export const LLMExplorer = () => {
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