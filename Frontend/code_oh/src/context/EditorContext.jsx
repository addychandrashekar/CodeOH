import React, { createContext, useContext, useState } from 'react'
import { executeCode } from '../services/PistonAPI'
import { useToast } from '@chakra-ui/react'
import { LANGUAGE_VERSIONS } from '../services/languageVersions'
import { useFiles } from '../context/FileContext'


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
    const [consoleHistory, setConsoleHistory] = useState([])
    const { files, setFiles } = useFiles()  // Add this line
    const toast = useToast()

    const handleConsoleInput = async (input) => {
        try {
            // Handle shell commands
            const shellCommands = {
                'clear': () => {
                    setOutput('')
                    setError('')
                    setConsoleHistory([])
                    return true
                },
                'ls': async () => {
                    if (!files || files.length === 0) {
                        setConsoleHistory(prev => [...prev, { type: 'output', content: 'No files found' }])
                        return true
                    }
                    const fileList = files.map(f => f.label).join('\n')
                    setConsoleHistory(prev => [...prev, { type: 'output', content: fileList }])
                    return true
                },
                'cat': async (filename) => {
                    if (!files) return false
                    const file = files.find(f => f.label === filename)
                    if (file) {
                        setConsoleHistory(prev => [...prev, { type: 'output', content: file.data.content }])
                    } else {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `File ${filename} not found` }])
                    }
                    return true
                },
                'mkdir': async (dirname) => {
                    if (!dirname) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: 'Directory name is required' }])
                        return true
                    }
                    const newFolder = {
                        key: dirname,
                        label: dirname,
                        data: { isDirectory: true },
                        children: []
                    }
                    setFiles(prev => [...prev, newFolder])
                    setConsoleHistory(prev => [...prev, { type: 'output', content: `Created directory ${dirname}` }])
                    return true
                }
            }

            // Add command to history
            setConsoleHistory(prev => [...prev, { type: 'input', content: input }])

            // Parse command and arguments
            const [cmd, ...args] = input.trim().split(' ')
            
            // Check if it's a shell command
            if (shellCommands[cmd]) {
                await shellCommands[cmd](...args)
                return
            }

            // If not a shell command, execute as code
            const result = await executeCode(language, input)
            
            if (result.run) {
                const outputText = result.run.output || ''
                const errorText = result.run.stderr || ''
                
                if (outputText) {
                    setConsoleHistory(prev => [...prev, { type: 'output', content: outputText }])
                }
                if (errorText) {
                    setConsoleHistory(prev => [...prev, { type: 'error', content: errorText }])
                }

                setOutput(outputText)
                setError(errorText)
            }
        } catch (error) {
            const errorMessage = error.message || 'An error occurred while executing the command'
            setConsoleHistory(prev => [...prev, { type: 'error', content: errorMessage }])
            setError(errorMessage)
        }
    }

    const runCode = async () => {
        if (!editorRef) return

        try {
            setIsLoading(true)
            const sourceCode = editorRef.getValue()
            if (!sourceCode) return

            const result = await executeCode(language, sourceCode)
            
            if (result.run) {
                setOutput(result.run.output || '')
                setError(result.run.stderr || '')
                
                // Add execution result to console history
                if (result.run.output) {
                    setConsoleHistory(prev => [...prev, { type: 'output', content: result.run.output }])
                }
                if (result.run.stderr) {
                    setConsoleHistory(prev => [...prev, { type: 'error', content: result.run.stderr }])
                }

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
            const errorMessage = error.message || 'An error occurred while executing the code'
            setError(errorMessage)
            setConsoleHistory(prev => [...prev, { type: 'error', content: errorMessage }])
            toast({
                title: 'Error',
                description: errorMessage,
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
            isLoading,
            handleConsoleInput,
            consoleHistory
        }}>
            {children}
        </EditorContext.Provider>
    )
}


