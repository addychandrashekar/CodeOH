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
export const CodeEditor = () => {
    // Editor reference for direct manipulation
    const tempEditorRef = useRef()
    // Local state for editor content
    const [value, setValue] = useState('')
    const [docState, setDocState] = useState(null);
    // Editor context for language and reference management
    const { editorRef, setEditorRef, language, setLanguage } = useEditor() 
    // File context for active file management
    const { activeFile } = useFiles()
    const { user } = useKindeAuth();

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
    }
    // Update editor content and language when active file changes
    useEffect(() => {
        if (activeFile) {
            const fileExtension = activeFile.name.split('.').pop()
            const newLanguage = getLanguageFromExtension(fileExtension)
            setLanguage(newLanguage)
            setValue(activeFile.content || CODE_SNIPPETS[newLanguage] || '')
            setDocState(activeFile);
        } else {
            setValue('');
            setDocState(null);
        }
    }, [activeFile])

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

    return (
        <Box h="100%" overflow="hidden">
            <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={value}
                // onChange={(newValue) => setValue(newValue)}
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




