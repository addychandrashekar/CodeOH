import { Box } from '@chakra-ui/react'
import { Editor } from '@monaco-editor/react'
import React from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import { useFiles } from '../../context/FileContext'
import { CODE_SNIPPETS } from '../../services/languageVersions'
import { useEffect } from 'react'
import { useEditor } from '../../context/EditorContext'


export const CodeEditor = () => {
    const editorRef = useRef()
    const [value, setValue] = useState('')
    const { setEditorRef, language, setLanguage } = useEditor() 
    const { activeFile } = useFiles()

    useEffect(() => {
        if (activeFile) {
            const fileExtension = activeFile.name.split('.').pop()
            const newLanguage = getLanguageFromExtension(fileExtension)
            setLanguage(newLanguage)
            setValue(CODE_SNIPPETS[newLanguage] || '')
        }
    }, [activeFile])

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

    const onMount = (editor) => {
        editorRef.current = editor
        setEditorRef(editor)
        editor.focus()
    }

    return (
        <Box h="100%" overflow="hidden">
            <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={value}
                onMount={onMount}
                onChange={(newValue) => setValue(newValue)}
            />
        </Box>

    )
}