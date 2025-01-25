import React, { createContext, useContext, useState } from 'react'
import { executeCode } from '../services/PistonAPI'

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

    const runCode = async () => {

        const [isLoading, setIsLoading] = useState(false)

        if (!editorRef) return

        try {
            setIsLoading(true)
            const sourceCode = editorRef.getValue() // This is the issue
            if (!sourceCode) return

            console.log('Running code:', sourceCode) 
            const result = await executeCode(language, sourceCode)
            console.log('API Response:', result) 
            
            if (result.run) {
                setOutput(result.run.output || '')
                setError(result.run.stderr || '')
            }
        } catch (error) {
            console.error('Error executing code:', error)
            setError(error.message || 'An error occurred while executing the code')
        }
        finally {
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
            error
        }}>
            {children}
        </EditorContext.Provider>
    )
}