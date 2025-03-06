import React, { useState, useEffect } from 'react';
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
import { BACKEND_API_URL } from '../../services/BackendServices';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";


const handleSignOut = () => {
  logout(); // trigger the Kinde sign-out process
};
/**
 * Generates icons for folders and files
 */
const getNodeIcon = (node) => {
  if (node.children?.length > 0) {
    return <i className="pi pi-folder-open" style={{ color: 'orange', marginRight: '5px' }} />;
  }
  const extension = node.label.split('.').pop();
  return LANGUAGE_ICONS[extension] ? (
    <img src={LANGUAGE_ICONS[extension]} alt={extension} style={{ width: '16px', height: '16px', marginRight: '5px' }} />
  ) : (
    <i className="pi pi-file" style={{ marginRight: '5px' }} />
  );
};

/**
 * Processes uploaded files & folders into a tree structure
 */
const buildFolderTree = (fileList) => {
  const root = [];

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        console.log(`Read file ${file.name}, content length: ${content.length}`);
        console.log(`First 50 chars: ${content.substring(0, 50)}...`);
        resolve(content);
      };
      reader.onerror = (error) => {
        console.error(`Error reading file ${file.name}:`, error);
        reject(error);
      };
      reader.readAsText(file);
    }).catch(error => {
      console.error(`Failed to read file ${file.name}:`, error);
      return ""; // Return empty string on error, but log it
    });
  };

  const processFile = async (file) => {
    const content = await readFileContent(file);
    console.log(`Processing file ${file.name}, content length: ${content.length}`);
    
    const pathParts = file.webkitRelativePath
      ? file.webkitRelativePath.split('/')
      : file.name.split('/');
    let currentLevel = root;
    let cumulativePath = '';

    pathParts.forEach((part, index) => {
      cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;

      let node = currentLevel.find((item) => item.label === part);
      if (!node) {
        node = { 
          key: cumulativePath, 
          label: part, 
          children: [], 
          data: {
            content: index === pathParts.length - 1 ? content : null,
            isDirectory: index !== pathParts.length - 1,
            fileType: index === pathParts.length - 1 ? part.split('.').pop() : null
          } 
        };
        currentLevel.push(node);
      }

      currentLevel = node.children;
    });
  };
  return Promise.all(Array.from(fileList).map(processFile)).then(() => root);
};

const FileItem = ({ item }) => {
  const { colorMode } = useColorMode();
  const { setActiveFile, activeFile } = useFiles();
  const { user } = useKindeAuth();
  const toast = useToast();
  const isActive = activeFile?.name === item.label;

  const handleFileClick = async () => {
    try {
      // Only fetch content if it's a file (not a directory)
      if (!item.children?.length) {
        console.log('File clicked:', {
          item,
          key: item.key,
          userId: user?.id,
          isDirectory: !!item.children?.length
        });
        
        // Make sure we have both item.key and user.id
        if (!item.key || !user?.id) {
          console.error('Missing required data:', { itemKey: item.key, userId: user?.id });
          return;
        }

        // Remove any quotes or extra spaces from the key
        const cleanKey = item.key.replace(/['"]/g, '').trim();
        console.log('Making request to:', `${BACKEND_API_URL}/api/files/${cleanKey}/content?userId=${user.id}`);

        const response = await fetch(
          `${BACKEND_API_URL}/api/files/${cleanKey}/content?userId=${user.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('File content received:', {
            contentLength: data.content ? data.content.length : 0,
            preview: data.content ? data.content.substring(0, 100) + '...' : 'Empty content',
            fileType: data.fileType
          });
          
          // If content is empty but we should have content, log a warning
          if (!data.content || data.content.length === 0) {
            console.warn('Warning: File content is empty!', { fileId: cleanKey, fileName: item.label });
          }
          
          setActiveFile({
            name: item.label,
            content: data.content || '',
            fileType: item.data.fileType || data.fileType
          });
          
          console.log('Active file set:', {
            name: item.label,
            contentLength: (data.content || '').length,
            fileType: item.data.fileType || data.fileType,
            firstChars: data.content ? data.content.substring(0, 50) + '...' : 'Empty content'
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          
          toast({
            title: "Error",
            description: `Failed to load file content: ${errorData.detail || response.statusText}`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error("Error loading file content:", error);
      toast({
        title: "Error",
        description: "Failed to load file content: " + error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <HStack
      p={1}
      w="full"
      bg={isActive ? THEME_CONFIG.DARK.HOVER : THEME_CONFIG.DARK.BACKGROUND}
      _hover={{ bg: THEME_CONFIG.DARK.HOVER }}
      cursor="pointer"
      onClick={handleFileClick}
    >
      {getNodeIcon(item)}
      <Text fontSize={THEME_CONFIG.FILENAME_FONT_SIZE} fontFamily={THEME_CONFIG.FONT_FAMILY}>
        {item.label}
      </Text>
      <IconButton
        size="xs"
        icon={<DeleteIcon />}
        variant="ghost"
        onClick={(e) => e.stopPropagation()} // Implement delete functionality
      />
    </HStack>
  );
};

/**
 * Recursively processes files/folders into a format suitable for the backend
 */
const processFileTree = (nodes, parentFolderId = null) => {
  let folders = [];
  let files = [];

  nodes.forEach((node) => {
    if (node.children?.length > 0) {
      let folderData = { name: node.label, parentFolderId };
      folders.push(folderData);
      let processed = processFileTree(node.children, folderData.name);
      folders = [...folders, ...processed.folders];
      files = [...files, ...processed.files];
    } else {
      console.log(`Processing file for upload: ${node.label}, content length: ${node.data.content?.length || 0}`);
      files.push({
        filename: node.label,
        content: node.data.content || "",
        folderName: parentFolderId,
        fileType: node.data.fileType
      });
    }
  });

  return { folders, files };
};

export const FileExplorer = () => {
  const { colorMode } = useColorMode();
  const { files, setFiles } = useFiles();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const toast = useToast();
  const { user , logout} = useKindeAuth();

  const fetchAndUpdateFiles = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/files?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        // Extract the children from the default project
        const filesWithoutDefault = data.files?.[0]?.children || [];
        setFiles(filesWithoutDefault);
      } else {
        console.error("Error fetching files");
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };
  /**
   * Fetch stored files and folders from the backend
   */
  useEffect(() => {
    if (user?.id) fetchAndUpdateFiles();
  }, [user?.id]);

  const shouldSkipFile = (file) => {
      // List of binary file extensions to skip
      const skipPatterns = [
          // Binary files
          '.zip', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
          '.ppt', '.pptx', '.exe', '.dll', '.so', '.dylib',
          '.jar', '.war', '.ear', '.class', '.pyc',
          
          // Wandb specific files
          '.wandb',        // wandb binary files
          'wandb-metadata.json',  // wandb metadata
          'wandb-summary.json',   // wandb summary
          'debug.log',     // wandb logs
          'debug-internal.log',   // wandb internal logs
          
          // System and cache files
          '.DS_Store',
          'Thumbs.db',
          '.git',
          '__pycache__',
          '*.pyc',
          
          // Other common binary or large files
          '.pkl',          // pickle files
          '.npy', '.npz',  // numpy binary files
          '.pt', '.pth',   // PyTorch model files
          '.h5', '.hdf5',  // HDF5 files
          '.bin',          // generic binary files
          '.data',         // generic data files
          '.index',        // index files
          '.pb'           // protocol buffer files
      ];


      // Function to check if a file matches any pattern
      const matchesPattern = (filename, pattern) => {
          if (pattern.startsWith('.')) {
              // Extension match
              return filename.toLowerCase().endsWith(pattern);
          } else if (pattern.includes('*')) {
              // Wildcard match
              const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
              return regex.test(filename);
          } else {
              // Exact match
              return filename === pattern;
          }
      };

      // Check if file should be skipped
      const shouldSkip = skipPatterns.some(pattern => matchesPattern(file.name, pattern));
      
      if (shouldSkip) {
          console.log(`Skipping file: ${file.name} (matches skip pattern)`);
          return true;
      }

      // Additional check: Try to detect binary content in the first few bytes
      // This is a more thorough way to detect binary files
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              const bytes = new Uint8Array(e.target.result);
              // Check first 32 bytes for null bytes or other binary indicators
              for (let i = 0; i < Math.min(32, bytes.length); i++) {
                  if (bytes[i] === 0) { // Found null byte
                      console.log(`Skipping file: ${file.name} (contains binary data)`);
                      resolve(true);
                      return;
                  }
              }
              resolve(false);
          };
          reader.onerror = () => resolve(true); // Skip on error
          reader.readAsArrayBuffer(file.slice(0, 32)); // Read only first 32 bytes
      });
  };
  /**
   * Handles uploading folders & files to the backend
   */

  const handleFileUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    try {
      console.log(`Processing ${fileList.length} files`);
      
      // Show loading toast
      const loadingToast = toast({
        title: "Uploading files...",
        description: "Please wait while your files are being processed",
        status: "loading",
        duration: null,
        isClosable: false,
      });

      // Create a map of filenames to their actual File objects for easier lookup
      const fileMap = {};
      
      // Process files and check which ones should be skipped
      const fileChecks = await Promise.all(Array.from(fileList).map(async file => {
        const shouldSkip = await shouldSkipFile(file);
        if (!shouldSkip) {
          const path = file.webkitRelativePath || file.name;
          fileMap[path] = file;
          fileMap[file.name] = file;
        }
        return { file, shouldSkip };
      }));

      // Filter out skipped files
      const validFiles = fileChecks
        .filter(({ shouldSkip }) => !shouldSkip)
        .map(({ file }) => file);

      console.log(`Found ${validFiles.length} valid files to process`);
      
      const fileTree = await buildFolderTree(validFiles);
      const { folders, files: filesToProcess } = processFileTree(fileTree);

      // Read all file contents directly
      const filesToUpload = await Promise.all(filesToProcess.map(async fileData => {
        const filePath = fileData.folderName
          ? `${fileData.folderName}/${fileData.filename}`
          : fileData.filename;
        const actualFile = fileMap[filePath] || fileMap[fileData.filename];
        
        if (!actualFile) {
          console.log(`Skipping file: ${fileData.filename} (not found in map)`);
          return null;
        }

        try {
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error(`Error reading file: ${e.target.error}`));
            reader.readAsText(actualFile);
          });
          
          console.log(`Successfully read file ${fileData.filename}, content length: ${content.length}`);
          return {
            filename: fileData.filename,
            content: content,
            folderName: fileData.folderName || null,
            fileType: fileData.filename.split('.').pop() || ''
          };
        } catch (error) {
          console.error(`Failed to read file ${fileData.filename}:`, error);
          return null;
        }
      }));

      // Filter out null entries (skipped files)
      const validFilesToUpload = filesToUpload.filter(file => file !== null);

      const payload = {
        userId: user?.id,
        folders: folders.map(folder => ({
          name: folder.name,
          parentFolderId: folder.parentFolderId || null
        })),
        files: validFilesToUpload
      };
        
      const response = await fetch(`${BACKEND_API_URL}/api/files/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Close loading toast
      toast.close(loadingToast);

      if (response.ok) {
        const data = await response.json();
        console.log("Upload response:", data);
        
        // Immediately fetch and update the file structure
        await fetchAndUpdateFiles();

        toast({ 
          title: "Upload successful!", 
          description: `Successfully uploaded ${validFilesToUpload.length} files`,
          status: "success", 
          duration: 3000, 
          isClosable: true 
        });
      } else {
        const errorData = await response.json();
        console.error("Upload error:", errorData);
        toast({ 
          title: "Upload failed", 
          description: errorData.message || "An error occurred during upload",
          status: "error", 
          duration: 3000, 
          isClosable: true 
        });
      }
    } catch (error) {
      console.error("Failed to process upload:", error);
      toast({ 
        title: "Upload failed", 
        description: "An error occurred while processing the files",
        status: "error", 
        duration: 3000, 
        isClosable: true 
      });
    }
  };    
        
  return (
    <VStack align="stretch" spacing={4} h="100%" bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
      <HStack justify="space-between" p={2}>
        <Text fontSize="sm" fontWeight="bold">EXPLORER</Text>
        <HStack spacing={2}>
          <Input type="file" multiple display="none" id="file-upload" webkitdirectory="true" onChange={handleFileUpload} />
          <label htmlFor="file-upload">
            <IconButton size="xs" as="span" icon={<i className="pi pi-file-import" style={{ color: 'white', marginRight: '5px' }} />} _hover={{ cursor: 'pointer' }} />
          </label>
          <IconButton size="xs" icon={<i className="pi pi-file-plus" style={{ color: 'white', marginRight: '5px' }} />} onClick={() => setIsCreating(true)} />
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
                setFiles([...files, { key: newFileName, label: newFileName, data: { content: '' }, children: [] }]);
                setNewFileName('');
                setIsCreating(false);
              }
            }}
          />
        </Box>
      )}

      <Box flex="1" overflowY="auto">
        <Tree
          value={files}
          nodeTemplate={(node, options) => <FileItem item={node} />}
          showLines
        />
      </Box>

      {/* Add the sign out button at the bottom */}
      <Box p={2} borderTop="1px" borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}>
        <HStack 
          w="full" 
          p={2} 
          cursor="pointer"
          _hover={{ bg: THEME_CONFIG.DARK.HOVER }}
          onClick={() => logout()}
          borderRadius="md"
        >
          <i className="pi pi-sign-out" style={{ color: colorMode === 'dark' ? 'white' : 'black' }} />
          <Text fontSize="sm">Sign Out</Text>
        </HStack>
      </Box>
    </VStack>
  );
};
