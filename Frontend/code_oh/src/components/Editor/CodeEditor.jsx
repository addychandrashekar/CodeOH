import { Box } from '@chakra-ui/react'
import { Editor } from '@monaco-editor/react'
import React from 'react'
import { useState } from 'react'
import { useRef } from 'react'



export const CodeEditor = () => {
    const editorRef = useRef()
    const [value, setValue] = useState('')

    const onMount = (editor) => {
        editorRef.current = editor
        editor.focus()
    }
    const [language, setLanguage] = useState('python')
  return (
    <Box>
          <Editor
              height="90vh"
              theme="vs-dark"
              defaultLanguage="javascript"
              defaultValue="// some comment"
              onMount={onMount}
              value={value}
              onChange={(newValue) => setValue(newValue)}
          />
    </Box>
  )
}
