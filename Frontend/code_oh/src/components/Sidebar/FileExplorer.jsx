import { 
  Box, 
  Button, 
  Input, 
  VStack, 
  HStack, 
  Text, 
  useColorMode,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton
} from '@chakra-ui/react'
import { AddIcon, ChevronDownIcon} from '@chakra-ui/icons'
import { VscFile } from 'react-icons/vsc'
import { useState } from 'react'
import { useFiles } from '../../context/FileContext' 

// Reference the language versions from the existing file
import { LANGUAGE_VERSIONS } from '../../services/languageVersions'


export const FileExplorer = () => {
  const { files, setFiles } = useFiles()
  const { colorMode } = useColorMode()
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')


  const fileExtensions = Object.keys(LANGUAGE_VERSIONS).map(lang => {
    switch(lang) {
      case 'javascript': return '.js'
      case 'python': return '.py'
      case 'java': return '.java'
      case 'typescript': return '.ts'
      default: return `.${lang}`
    }
  })

  const createFile = (extension) => {
    if (newFileName) {
      const fileName = newFileName.includes('.') ? newFileName : `${newFileName}${extension}`
      setFiles([...files, { name: fileName, content: '' }])
      setNewFileName('')
      setIsCreating(false)
    }
  }

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="bold">Files</Text>
        <IconButton
          icon={<AddIcon />}
          size="sm"
          onClick={() => setIsCreating(true)}
          aria-label="Create new file"
        />
      </HStack>

      {isCreating && (
        <HStack>
          <Input
            size="sm"
            placeholder="File name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <Menu>
            <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
              Type
            </MenuButton>
            <MenuList>
              {fileExtensions.map((ext) => (
                <MenuItem key={ext} onClick={() => createFile(ext)}>
                  {ext}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </HStack>
      )}

        <VStack align="stretch" spacing={2}>
        {files.map((file, index) => (
            <HStack
            key={index}
            p={2}
            borderRadius="md"
            bg={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
            _hover={{
                bg: colorMode === 'dark' ? 'gray.600' : 'gray.300'
            }}
            >
            <VscFile />
            <Text>{file.name}</Text>
            </HStack>
        ))}
        </VStack>
    </VStack>
  )
}