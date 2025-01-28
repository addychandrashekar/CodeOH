import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Input,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  ChevronRightIcon, 
  ChevronDownIcon, 
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
          // deleteItem(item.path);
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

  const fileExtensions = ['.js', '.py', '.java', '.cpp', '.ts'];

  const createFile = (extension) => {
    if (newFileName) {
      const fileName = newFileName.includes('.') ? newFileName : `${newFileName}${extension}`;
      setFiles([...files, { name: fileName, content: '' }]);
      setNewFileName('');
      setIsCreating(false);
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
        <IconButton
          size="xs"
          icon={<AddIcon />}
          onClick={() => setIsCreating(true)}
          color={colorMode === 'dark' ? 'white' : 'black'}
        />
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
                createFile(fileExtensions[0]);
              }
            }}
            color={colorMode === 'dark' ? 'white' : 'black'}
            bg={colorMode === 'dark' ? 'gray.700' : 'white'}
          />
          {/* <HStack mt={2} spacing={2}>
            {fileExtensions.map((ext) => (
              <Text
                key={ext}
                cursor="pointer"
                onClick={() => createFile(ext)}
                fontSize="xs"
                color={colorMode === 'dark' ? 'blue.300' : 'blue.500'}
                _hover={{ textDecoration: 'underline' }}
              >
                {ext}
              </Text>
            ))}
          </HStack> */}
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