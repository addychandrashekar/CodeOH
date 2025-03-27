import { Box } from '@chakra-ui/react'
import { Editor } from '@monaco-editor/react'
import React, { useCallback } from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import { useFiles } from '../../context/FileContext'
import { CODE_SNIPPETS } from '../../services/languageVersions'
import { useEffect } from 'react'
import { useEditor } from '../../context/EditorContext'
import { configureEditor } from '../../services/syntax&IntelliSense'
import { THEME_CONFIG } from '../../configurations/config'
import _, {debounce} from 'lodash';
import { BACKEND_API_URL } from '../../services/BackendServices';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

/**
 * CodeEditor component that provides a Monaco-based code editor with language support
 * and syntax highlighting. Integrates with FileContext and EditorContext for file
 * management and editor state.
 * 
 * @component
 * @returns {JSX.Element} A Monaco code editor instance with configured options
 */
export const CodeEditor = ({ pendingModification }) => {
    // Editor reference for direct manipulation
    const tempEditorRef = useRef()
    // Local state for editor content
    const [value, setValue] = useState('')
    const [docState, setDocState] = useState(null);
    // Editor context for language and reference management
    const { editorRef, setEditorRef, language, setLanguage } = useEditor() 
    // File context for active file management
    const { activeFile, setActiveFile } = useFiles()
    const { user } = useKindeAuth();
    // State for diff mode
    const [diffMode, setDiffMode] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [modifiedContent, setModifiedContent] = useState('');
    // Track last modification timestamp
    const [lastModified, setLastModified] = useState(0);

    /**
     * Handles the editor initialization when it mounts
     * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor - The Monaco editor instance
     * @param {import('monaco-editor').editor.IStandaloneCodeEditor} monaco - The Monaco API object
     */
    const handleEditorDidMount = (editor, monaco) => {
        tempEditorRef.current = editor
        setEditorRef(editor)
        configureEditor(editor, monaco, language)
        editor.focus()
        
        // Set up global Monaco reference
        window.monaco = monaco;
    }
    
    /**
     * Explicitly reload the content for the active file from the backend
     */
    const reloadActiveFileContent = async () => {
        if (!activeFile || !user) return;
        
        const fileId = activeFile.key;
        try {
            console.log(`Explicitly reloading content for file ID: ${fileId}`);
            const response = await fetch(
                `${BACKEND_API_URL}/api/files/${fileId}/content?userId=${user.id}`,
                { method: 'GET' }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log(`Reloaded file content, length: ${data.content.length}`);
                
                // Update the active file with fresh content
                const updatedFile = {
                    ...activeFile,
                    content: data.content
                };
                
                // Update both the active file and editor state
                setActiveFile(updatedFile);
                setValue(data.content);
                setDocState({
                    ...docState,
                    content: data.content
                });
                
                // Update the last modified timestamp
                setLastModified(Date.now());
            } else {
                console.error("Failed to reload file content:", await response.text());
            }
        } catch (error) {
            console.error("Error reloading file content:", error);
        }
    };
    
    // Update editor content and language when active file changes
    useEffect(() => {
        if (activeFile) {
            const fileExtension = activeFile.name.split('.').pop()
            const newLanguage = getLanguageFromExtension(fileExtension)
            setLanguage(newLanguage)
            setValue(activeFile.content || CODE_SNIPPETS[newLanguage] || '')
            setDocState(activeFile);
            
            // Reset diff mode when a new file is loaded
            setDiffMode(false);
        } else {
            setValue('');
            setDocState(null);
        }
    }, [activeFile])
    
    // Check for pending modifications that should be shown as diffs
    useEffect(() => {
        if (pendingModification && 
            activeFile && 
            pendingModification.previous_content) {
            
            // Clean filenames for comparison (without @ symbol)
            const cleanActiveFileName = activeFile.name.replace(/^@/, '');
            const cleanPendingFileName = pendingModification.filename.replace(/^@/, '');
            
            console.log("Checking diff view for:", {
                activeFile: cleanActiveFileName,
                pendingMod: cleanPendingFileName,
                match: cleanActiveFileName === cleanPendingFileName
            });
            
            // Check if this modification is for the current file
            if (cleanActiveFileName === cleanPendingFileName) {
                console.log("Showing diff for pending modification of:", pendingModification.filename);
                setDiffMode(true);
                setOriginalContent(pendingModification.previous_content);
                setModifiedContent(pendingModification.content);
            } else {
                // If file doesn't match, reset diff mode
                setDiffMode(false);
            }
        } else if (pendingModification === null && diffMode) {
            // When a modification is confirmed or canceled, reload the file content
            setDiffMode(false);
            reloadActiveFileContent();
        } else {
            setDiffMode(false);
        }
    }, [pendingModification, activeFile]);

    const handleAutoSave = async (docState) => {
        if (!docState)
          return;
    
        const payload = {
          content: docState.content
        };
                
        // Remove any quotes or extra spaces from the key
        //  const cleanKey = activeFile. .key.replace(/['"]/g, '').trim();
         console.log('Making request to:', `${BACKEND_API_URL}/api/files/${docState.key}/content?userId=${user.id}`);
    
         const response = await fetch(
           `${BACKEND_API_URL}/api/files/${docState.key}/content?userId=${user.id}`,
            {
              method: 'POST',
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
         );
    
          if (!response.ok) {
            console.warn("File didn't save properly");
          } else {
            console.log("saved file");
          }
      };
        

    const debouncedSave = useCallback(
        debounce((docState) => {
            handleAutoSave(docState);
        }, 250),
        []
      );


    useEffect(() => {
        debouncedSave(docState);
    }, [docState]);

    /**
     * Maps file extensions to Monaco editor language identifiers
     * @param {string} ext - The file extension
     * @returns {string} The corresponding Monaco language identifier
     */
    const getLanguageFromExtension = (ext) => {
        const extensionMap = {
            'py': 'python',
            'js': 'javascript',
            'java': 'java',
            'ts': 'typescript',
            'csharp': 'csharp',
            'php': 'php',
            'cpp': 'cpp',
            'c': 'c',
            'dart': 'dart'
        }
        return extensionMap[ext] || 'javascript'
    }


    const handleContentChange = (content) => {
        setDocState(prevState => ({
            ...prevState, 
            content: content
        }));
    };
    
    // Render different editor based on diff mode
    if (diffMode && window.monaco) {
        console.log("Rendering diff editor with:", {
            original: originalContent.substring(0, 100) + "...",
            modified: modifiedContent.substring(0, 100) + "..."
        });
        
        return (
            <Box h="100%" overflow="hidden">
                <Editor
                    height="100%"
                    theme="vs-dark"
                    original={originalContent}
                    modified={modifiedContent}
                    language={language}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly: true, // Diff view is read-only
                        renderSideBySide: true,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontSize: THEME_CONFIG.EDITOR_FONT_SIZE,
                        fontFamily: THEME_CONFIG.FONT_FAMILY,
                        diffEditor: {
                            renderSideBySide: true,
                            enableSplitViewResizing: true,
                            ignoreTrimWhitespace: false,
                        }
                    }}
                />
            </Box>
        );
    }

    return (
        <Box h="100%" overflow="hidden">
            <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={value}
                onChange={handleContentChange}
                onMount={handleEditorDidMount}
                options={{
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 10 },
                    fontSize: THEME_CONFIG.EDITOR_FONT_SIZE,
                    fontFamily: THEME_CONFIG.FONT_FAMILY,
                    // Enable advanced editor features
                    bracketPairColorization: { enabled: true }, // Enable bracket pair colorization
                    guides: {
                        bracketPairs: true,    // Show bracket pair guides
                        indentation: true      // Show indentation guides
                    }
                }}
            />
        </Box>
    )
}




