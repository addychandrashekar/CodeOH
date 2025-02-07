import React, { useState, useRef } from 'react';
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
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Tree } from 'primereact/tree';
import { useFiles } from '../../context/FileContext';
import { LANGUAGE_ICONS } from '../../services/languageVersions';
import { THEME_CONFIG } from '../../configurations/config';




/**
 * 
 * @param {Object} item - The file or folder node to render
 * @returns  A file item component that displays a file or folder in the file explorer
 */
const FileItem = ({ item, depth = 0 }) => {
  const { colorMode } = useColorMode();
  const { setActiveFile, activeFile } = useFiles();
  
  const isActive = activeFile?.name === item.label;
  const bgColor = colorMode === 'dark' ? 'gray.800' : 'white';

  return (
    <HStack
      p={1}
      w="full" // 👈 Ensures item spans the entire width
      bg={isActive ? (colorMode === 'dark' ? THEME_CONFIG.DARK.HOVER : THEME_CONFIG.LIGHT.HOVER) : 
        (colorMode === 'dark' ? THEME_CONFIG.DARK.BACKGROUND : THEME_CONFIG.LIGHT.BACKGROUND)}
      _hover={{
        bg: colorMode === 'dark' ? THEME_CONFIG.DARK.HOVER : THEME_CONFIG.LIGHT.HOVER
      }}
      cursor="pointer"
      onClick={() => setActiveFile({
        name: item.label,
        content: item.data.content
      })}
      className="file-item"
    >
      {getNodeIcon(item)}
      <Text 
        color={colorMode === 'dark' ? THEME_CONFIG.DARK.TEXT : THEME_CONFIG.LIGHT.TEXT}
        fontSize={THEME_CONFIG.FILENAME_FONT_SIZE}
        fontFamily={THEME_CONFIG.FONT_FAMILY}
      >
        {item.label}
      </Text>
      <IconButton
        size="xs"
        icon={<DeleteIcon />}
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          // TODO : Implement delete functionality here
        }}
        color={colorMode === 'dark' ? 'white' : 'black'}
      />
    </HStack>
  );
};


// ---------------------
// 1) Build a nested tree from uploaded files
// ---------------------
const buildFolderTree = (fileList) => {
  /*
    We store tree nodes in this structure:
      {
        key: string (unique path),
        label: string (folder or file name),
        children: [],
        icon: [optional primeReact icon or your own icon],
        data: { content? } or additional info
      }
  */
  const root = []; // top-level array
  const lookup = {}; // helps us find existing nodes quickly

  Array.from(fileList).forEach((file) => {
    const pathParts = file.webkitRelativePath
      ? file.webkitRelativePath.split('/')
      : file.name.split('/'); // fallback if no webkitRelativePath
    let currentLevel = root;
    let cumulativePath = '';

    pathParts.forEach((part, index) => {
      cumulativePath = cumulativePath
        ? `${cumulativePath}/${part}`
        : part; // build up the path incrementally

      // Check if node already exists at this level
      let node = currentLevel.find((item) => item.label === part);

      if (!node) {
        node = {
          key: cumulativePath, // full path
          label: part,
          children: [],
          data: {},
        };
        currentLevel.push(node);
      }

      // If it's the last part (i.e. the actual file), let's store file content
      if (index === pathParts.length - 1 && file.size !== undefined) {
        node.data.file = file;
      }

      // Move deeper
      currentLevel = node.children;
    });
  });

  return root;
};

// 2) Generate icons for each node (folder or file)
const getNodeIcon = (node) => {
  // If node has children, it's a folder
  if (node.children && node.children.length > 0) {
    return <i className="pi pi-folder-open" style={{ color: 'orange', marginRight: '5px' }} />;
  }
  
  // Otherwise it's a file, get icon based on extension
  const extension = node.label.split('.').pop();
  if (LANGUAGE_ICONS[extension]) {
    return <img 
      src={LANGUAGE_ICONS[extension]} 
      alt={extension} 
      style={{ 
        width: '16px', 
        height: '16px', 
        marginRight: '5px' 
      }} 
    />;
  }
  
  // Default file icon if no specific icon found
  return <i className="pi pi-file" style={{ marginRight: '5px' }} />;
};

// 3) Custom node template for the PrimeReact Tree
//    This replicates your FileItem design
const nodeTemplate = (node, options) => {
  const depth = options.props?.depth || 0;
  return <FileItem item={node} depth={depth} />;
};

export const FileExplorer = () => {
  const { colorMode } = useColorMode();
  const { files, setFiles } = useFiles(); 
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const toast = useToast();

  // ---------------------
  // 4) Handle folder/files upload
  // ---------------------
  const handleFileUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    // Build the new folder tree from uploaded items
    const newTree = buildFolderTree(fileList);

    // For reading each file’s text content, we do it asynchronously
    // so we can store it in data.content if you want.
    // (Optional: if you need text, do the reading here)
    for (let node of newTree) {
      await readAllChildFiles(node);
    }

    // Merge the newly uploaded tree with existing 'files' if needed
    // (If you want to keep everything in one big tree, you can do a merge.
    //  Otherwise, you can just add them. For simplicity, we'll just append.)
    setFiles((prev) => [...prev, ...newTree]);

    toast({
      title: 'Folder/files uploaded successfully!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // A helper to read all child files and store text in `data.content`
  const readAllChildFiles = async (node) => {
    if (node.data.file) {
      // It's a file node
      try {
        const content = await fileToText(node.data.file);
        node.data.content = content;
      } catch (e) {
        console.error('Error reading file', e);
      }
    }
    // Recursively handle children if it's a folder
    if (node.children?.length) {
      for (let child of node.children) {
        await readAllChildFiles(child);
      }
    }
  };

  // Simple util to read a file as text
  const fileToText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        resolve(evt.target.result);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // ---------------------
  // 5) Create a blank file at top-level
  // ---------------------
  const handleCreateFile = (filename) => {
    const fileNode = {
      key: filename,
      label: filename,
      data: { content: '' },
      children: [],
    };

    setFiles([...files, fileNode]);
  };

  // ---------------------
  // 6) Render
  // ---------------------
  return (
    <VStack
      align="stretch"
      spacing={4}
      h="100%"
      bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      color={colorMode === 'dark' ? 'white' : 'black'}
    >
      {/* Header Bar */}
      <HStack justify="space-between" p={2}>
        <Text fontSize="sm" fontWeight="bold">
          EXPLORER
        </Text>
        <HStack spacing={2}>
          {/* Upload Folder & File Input */}
          <Input
            type="file"
            multiple
            display="none"
            id="file-upload"
            // webkitdirectory allows selecting a folder,
            // but also works for files. Chrome-based only.
            webkitdirectory="true"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <IconButton
              padding={2}
              size="xs"
              as="span"
              icon={<i className="pi pi-file-import" style={{ color: 'white', marginRight: '5px' }} />}
              color={colorMode === 'dark' ? 'white' : 'black'}
              _hover={{ cursor: 'pointer' }}
            />
          </label>

          {/* Button to create a new file */}
          <IconButton
            padding={2}
            size="xs"
            icon={<i className="pi pi-file-plus" style={{ color: 'white', marginRight: '5px' }} />}
            onClick={() => setIsCreating(true)}
            color={colorMode === 'dark' ? 'white' : 'black'}
          />
        </HStack>
      </HStack>

      {/* New File Creation Input */}
      {isCreating && (
        <Box px={2}>
        <Input
          size="sm"
          placeholder="filename.ext"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const fileName = newFileName.includes('.')
                ? newFileName
                : `${newFileName}.txt`;
              handleCreateFile(fileName);
              setNewFileName('');
              setIsCreating(false);
            }
          }}
          color={colorMode === 'dark' ? THEME_CONFIG.DARK.TEXT : THEME_CONFIG.LIGHT.TEXT}
          bg={colorMode === 'dark' ? THEME_CONFIG.DARK.SECONDARY_BG : THEME_CONFIG.LIGHT.SECONDARY_BG}
          fontSize={THEME_CONFIG.FILENAME_FONT_SIZE}
          fontFamily={THEME_CONFIG.FONT_FAMILY}
        />
        </Box>
      )}

      {/* File/Folder Tree Display */}
      <Box flex="1" overflowY="auto">
        {/* 
           Use the PrimeReact Tree to show your nested structure.
           We pass a custom nodeTemplate to replicate the previous item style.
        */}
        <Tree
        value={files}
        nodeTemplate={(node, options) =>
            nodeTemplate(node, { ...options, props: { colorMode, depth: options.level } })
        }
        showLines={true}
        pt={{
            root: { 
              className: `w-full border-none ${colorMode === 'dark' ? 'bg-gray-800' : 'bg-white'}`,
              style: { fontSize: THEME_CONFIG.FILENAME_FONT_SIZE, fontFamily: THEME_CONFIG.FONT_FAMILY }
            }, // Full tree background
            container: { className: 'p-0 m-0 bg-gray-800 dark:bg-gray-800' }, // Fixes white space
            node: { className: 'p-0 m-0 bg-gray-800 dark:bg-gray-800' }, // Fixes node wrappers
            content: ({ context }) => ({
            className: `transition-colors bg-gray-800 dark:bg-gray-800
                ${context.selected ? 'bg-primary-50' : 'hover:bg-gray-700'}
                border-none rounded-none`
            }),
            treenode: { className: 'bg-gray-800 dark:bg-gray-800' }, // Fixes white toggle area
            toggler: { className: 'bg-transparent dark:bg-transparent text-white' }, // Fix caret background
            emptyMessage: { className: 'bg-gray-800 dark:bg-gray-800 text-gray-400 text-center' } // Fixes empty state
        }}
        />


      </Box>
    </VStack>
  );
};
