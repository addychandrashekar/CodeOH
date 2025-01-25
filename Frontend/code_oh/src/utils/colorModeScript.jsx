import { ColorModeScript as ChakraColorModeScript } from '@chakra-ui/react'
import theme from './theme'

export const ColorModeScript = () => {
  return <ChakraColorModeScript initialColorMode={theme.config.initialColorMode} />
}