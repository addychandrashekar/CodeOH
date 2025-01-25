import { Box, useColorMode } from '@chakra-ui/react'

export const ConsoleOutput = () => {

    const { colorMode } = useColorMode()

    return (
        <Box 
            gridArea='console'
            bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
            p={4}
            h="200px"
            borderTop="1px"
            borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        >
            Console Output
        </Box>
    )
}