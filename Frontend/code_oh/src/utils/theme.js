import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
}

const theme = extendTheme({ config, styles })

export default theme