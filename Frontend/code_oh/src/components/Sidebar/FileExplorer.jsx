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
    IconButton,
    useToast
} from '@chakra-ui/react'
import { AddIcon, ChevronDownIcon, AttachmentIcon } from '@chakra-ui/icons'
import { VscFile } from 'react-icons/vsc'
import { useState, useRef } from 'react'
import { useFiles } from '../../context/FileContext' 

// Reference the language versions from the existing file
import { LANGUAGE_VERSIONS } from '../../services/languageVersions'
import { LANGUAGE_ICONS } from '../../services/languageVersions'
import { Image } from '@chakra-ui/react'




const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()
  const iconUrl = LANGUAGE_ICONS[ext]
  
  if (iconUrl) {
    return <Image src={iconUrl} alt={`${ext} icon`} boxSize="20px" />
  }
  return <VscFile />
}

export const FileExplorer = () => {
    const { files, setFiles, setActiveFile } = useFiles()
    const { colorMode } = useColorMode()
    const [isCreating, setIsCreating] = useState(false)
    const [newFileName, setNewFileName] = useState('')
    const toast = useToast()
    const fileInputRef = useRef(null)

    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0]
        if (!uploadedFile) return

        const extension = uploadedFile.name.split('.').pop().toLowerCase()
        const supportedExtensions = ['py', 'java', 'js', 'ts', 'cpp', 'c', 'csharp', 'php', 'dart']

        if (!supportedExtensions.includes(extension)) {
            toast({
                title: 'Unsupported file type',
                description: 'Please upload a file with supported extension',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
            return
        }

        try {
            const content = await uploadedFile.text()
            const newFile = {
                name: uploadedFile.name,
                content: content
            }
            setFiles([...files, newFile])
            setActiveFile(newFile)
            toast({
                title: 'File uploaded',
                description: `${uploadedFile.name} has been added`,
                status: 'success',
                duration: 3000,
                isClosable: true
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to read file content',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
        }
    }

    const fileExtensions = Object.keys(LANGUAGE_VERSIONS).map(lang => {
        switch (lang) {
            case 'javascript': return '.js'
            case 'python': return '.py'
            case 'java': return '.java'
            case 'typescript': return '.ts'
            case 'c': return '.c'
            case 'cpp': return '.cpp'
            case 'csharp': return '.csharp'
            case 'php': return '.php'
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
            <HStack>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    display="none"
                    accept=".py,.java,.js,.ts,.cpp,.c,.csharp,.php,.dart"
                />
                <Button
                    leftIcon={<AttachmentIcon />}
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    w="100%"
                >
                    Upload File
                </Button>
            </HStack>

            <HStack justify="space-between" padding={2}>
                <Text fontSize="lg" fontWeight="bold">Files</Text>
                <IconButton
                    icon={<AddIcon />}
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    aria-label="Create new file"
                />
            </HStack>

            {isCreating && (
                <HStack padding={2}>
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
                        cursor="pointer"
                        onClick={() => setActiveFile(file)}
                    >
                        {getFileIcon(file.name)}
                        <Text>{file.name}</Text>
                    </HStack>
                ))}
            </VStack>
        </VStack>
    )
}