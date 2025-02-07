import { Box } from '@chakra-ui/react'
import { Editor } from '@monaco-editor/react'
import React from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import { useFiles } from '../../context/FileContext'
import { CODE_SNIPPETS } from '../../services/languageVersions'
import { useEffect } from 'react'
import { useEditor } from '../../context/EditorContext'
import { configureEditor } from '../../services/syntax&IntelliSense'
import { THEME_CONFIG } from '../../configurations/config'

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
    const editorRef = useRef()
    // Local state for editor content
    const [value, setValue] = useState('')
    // Editor context for language and reference management
    const { setEditorRef, language, setLanguage } = useEditor() 
    // File context for active file management
    const { activeFile } = useFiles()

    /**
     * Handles the editor initialization when it mounts
     * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor - The Monaco editor instance
     * @param {import('monaco-editor').editor.IStandaloneCodeEditor} monaco - The Monaco API object
     */
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor
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
        }
    }, [activeFile])

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



    return (
        <Box h="100%" overflow="hidden">
            <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={value}
                onChange={(newValue) => setValue(newValue)}
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




