import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Input,
  useColorMode,
    useToast,
  Image,
} from '@chakra-ui/react';
import { 
  DeleteIcon,
} from '@chakra-ui/icons';
import { useState } from 'react';
import { useFiles } from '../../context/FileContext';
import { LANGUAGE_ICONS } from '../../services/languageVersions';

// Helper function to get file icon
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop();
  return LANGUAGE_ICONS[extension] ? (
    <img src={LANGUAGE_ICONS[extension]} alt={extension} style={{ width: '16px', height: '16px' }} />
  ) : null;
};

const FileItem = ({ item, depth = 0 }) => {
  const { colorMode } = useColorMode();
  const { setActiveFile, activeFile } = useFiles();
  
  const isActive = activeFile?.name === item.name;

  return (
    <HStack
      p={2}
      pl={`${depth * 20 + 8}px`}
      cursor="pointer"
      bg={isActive ? (colorMode === 'dark' ? 'gray.700' : 'gray.200') : 'transparent'}
      _hover={{
        bg: colorMode === 'dark' ? 'gray.700' : 'gray.200'
      }}
      onClick={() => setActiveFile(item)}
    >
      {getFileIcon(item.name)}
      <Text color={colorMode === 'dark' ? 'white' : 'black'}>
        {item.name}
      </Text>
      <IconButton
        size="xs"
        icon={<DeleteIcon />}
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          // Implement delete functionality here
        }}
        color={colorMode === 'dark' ? 'white' : 'black'}
      />
    </HStack>
  );
};

export const FileExplorer = () => {
  const { colorMode } = useColorMode();
  const { files, setFiles } = useFiles();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const toast = useToast();

  const handleFileUpload = (event) => {
    const uploadedFiles = event.target.files;
    const newFiles = [];
    for (const file of uploadedFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newFiles.push({
          name: file.name,
          content: e.target.result,
        });
        if (newFiles.length === uploadedFiles.length) {
          setFiles((prevFiles) => [...prevFiles, ...newFiles]);
          toast({
            title: 'Files uploaded successfully!',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <VStack
      align="stretch"
      spacing={4}
      h="100%"
      bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      color={colorMode === 'dark' ? 'white' : 'black'}
    >
      <HStack justify="space-between" p={2}>
        <Text fontSize="sm" fontWeight="bold">EXPLORER</Text>
        <HStack spacing={2}>
          <IconButton
            size="xs"
            icon={
                <Image
                src="https://cdn-icons-png.flaticon.com/512/9672/9672517.png"
                alt="New Folder"
                boxSize="16px"
                />
            }
            onClick={() => setIsCreating(true)}
            color={colorMode === 'dark' ? 'white' : 'black'}
          />
          <Input
            type="file"
            multiple
            display="none"
            id="file-upload"
            onChange={handleFileUpload}
                  />
                  
          <label htmlFor="file-upload">
            <IconButton
              size="xs"
              as="span"
                icon={
                <Image
                    src="https://cdn-icons-png.flaticon.com/512/8637/8637099.png"
                    alt="New File"
                    boxSize="16px"
                />
                }
              color={colorMode === 'dark' ? 'white' : 'black'}
              _hover={{ cursor: 'pointer' }}
            />
          </label >

        </HStack>
      </HStack>

      {isCreating && (
        <Box px={2}>
          <Input
            size="sm"
            placeholder="filename.ext"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const fileName = newFileName.includes('.') ? newFileName : `${newFileName}.txt`;
                setFiles([...files, { name: fileName, content: '' }]);
                setNewFileName('');
                setIsCreating(false);
              }
            }}
            color={colorMode === 'dark' ? 'white' : 'black'}
            bg={colorMode === 'dark' ? 'gray.700' : 'white'}
          />
        </Box>
      )}

      <VStack align="stretch" spacing={0} overflowY="auto">
        {files.map((file, index) => (
          <FileItem key={index} item={file} />
        ))}
      </VStack>
    </VStack>
  );
};
