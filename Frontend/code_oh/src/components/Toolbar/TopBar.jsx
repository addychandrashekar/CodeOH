

// Implement the toolbar component

export default function TopBar() { 
    return (
        <Box 
        gridArea='top'
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
        >
        <Code>Code-Oh</Code>
        </Box>
    )
}
