import React, { createContext, useContext, useState } from 'react'
import { executeCode } from '../services/PistonAPI'
import { useToast } from '@chakra-ui/react'

const EditorContext = createContext()

export const useEditor = () => {
    const context = useContext(EditorContext)
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context
}

export const EditorProvider = ({ children }) => {
    const [editorRef, setEditorRef] = useState(null)
    const [language, setLanguage] = useState('javascript')
    const [output, setOutput] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const toast = useToast()

    const runCode = async () => {
        if (!editorRef) return

        try {
            setIsLoading(true)
            const sourceCode = editorRef.getValue()
            if (!sourceCode) return

            const result = await executeCode(language, sourceCode)
            
            if (result.run) {
                setOutput(result.run.output.split('\n') || '')
                setError(result.run.stderr || '')
                
                if (!result.run.stderr) {
                    toast({
                        title: 'Success',
                        description: 'Code executed successfully',
                        status: 'success',
                        duration: 3000,
                        isClosable: true
                    })
                }
            }
        } catch (error) {
            console.error('Error executing code:', error)
            setError(error.message || 'An error occurred while executing the code')
            toast({
                title: 'Error',
                description: error.message || 'An error occurred while executing the code',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <EditorContext.Provider value={{
            editorRef,
            setEditorRef,
            language,
            setLanguage,
            runCode,
            output,
            error,
            isLoading
        }}>
            {children}
        </EditorContext.Provider>
    )
}