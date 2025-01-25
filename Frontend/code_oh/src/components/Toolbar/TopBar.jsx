import { Box, Code, HStack, IconButton, useColorMode } from '@chakra-ui/react'
import { Image } from '@chakra-ui/react'



// const PLAY_ICON = 'https://cdn-icons-png.flaticon.com/512/0/375.png'  

// export const TopBar = () => {
//     const { colorMode } = useColorMode()
    
//     return (
//         <Box 
//             gridArea='top'
//             bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
//             h="40px"
//             display="flex"
//             alignItems="center"
//             px={4}
//         >
//             <HStack spacing={4} width="100%">
//                 <Code>Code-OH</Code>
//                 <IconButton
//                     icon={
//                         <Image 
//                             src={PLAY_ICON}
//                             alt="Play"
//                             boxSize="20px"
//                         />
//                     }
//                     aria-label="Run code"
//                     size="md"
//                     variant="ghost"
//                     p={2}  // Added padding
//                     _hover={{
//                         bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
//                     }}
//                 />
//             </HStack>
//         </Box>
//     )
// }



export const TopBar = () => {
    const { colorMode } = useColorMode()
    
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
                <Code fontSize="md">Code-OH</Code>
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
                    _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
                    }}
                />
            </HStack>
        </Box>
    )
}