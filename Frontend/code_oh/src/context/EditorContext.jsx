import React, { createContext, useContext, useState } from 'react'
import { executeCode } from '../services/PistonAPI'
import { useToast } from '@chakra-ui/react'
import { LANGUAGE_VERSIONS } from '../services/languageVersions'
import { useFiles } from '../context/FileContext'
import { WELCOME_ASCII, AUTHOR} from '../configurations/config'

/**
 * Context for managing editor state and functionality
 * @type {React.Context}
 */
const EditorContext = createContext()

/**
 * Custom hook to access the EditorContext
 * @returns {Object} Editor context value
 * @throws {Error} If used outside of EditorProvider
 */
export const useEditor = () => {
    const context = useContext(EditorContext)
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context
}


/**
 * Provider component for editor functionality
 * Manages editor state, file operations, and code execution
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const EditorProvider = ({ children }) => {
    // Editor state management
    const [editorRef, setEditorRef] = useState(null)
    const [language, setLanguage] = useState('javascript')
    const [output, setOutput] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [consoleHistory, setConsoleHistory] = useState([
        { type: 'output', content: WELCOME_ASCII }
    ])
    const { files, setFiles } = useFiles()  
    const toast = useToast()

    const [currentPath, setCurrentPath] = useState([])
    const [pendingModification, setPendingModification] = useState(null)

    /**
     * Gets files in the current directory path
     * @param {string[]} path - Array of directory names
     * @returns {Array} Array of file objects in the current directory
     */
    const getCurrentDirectoryFiles = (path) => {
        if (!files) return []
        
        let current = files
        for (const dir of path) {
            const found = current.find(f => f.label === dir && 
                (f.data.isDirectory || f.children)) // Check both isDirectory and children
            if (!found) return []
            current = found.children || []
        }
        return current
    }

    /**
     * Finds a file in the current directory path
     * @param {string[]} path - Array of directory names
     * @param {string} target - Target file name
     * @returns {Object|undefined} File object if found
     */
    const findFileInPath = (path, target) => {
        const current = getCurrentDirectoryFiles(path)
        return current.find(f => f.label === target)
    }

    /**
     * Adds a file to the specified path
     * @param {string[]} path - Array of directory names
     * @param {Object} newFile - File object to add
     */
    const addFileToPath = (path, newFile) => {
        if (path.length === 0) {
            setFiles(prev => [...prev, newFile])
            return
        }
        
        setFiles(prev => {
            const newFiles = [...prev]
            let current = newFiles
            for (const dir of path) {
                const found = current.find(f => f.label === dir && f.data.isDirectory)
                if (!found) return newFiles
                if (!found.children) found.children = []
                current = found.children
            }
            current.push(newFile)
            return newFiles
        })
    }

    /**
     * Removes a file from the specified path
     * @param {string[]} path - Array of directory names
     * @param {string} target - Target file name to remove
     */
    const removeFileFromPath = (path, target) => {
        setFiles(prev => {
            const newFiles = [...prev]
            if (path.length === 0) {
                return newFiles.filter(f => f.label !== target)
            }
            
            let current = newFiles
            for (const dir of path) {
                const found = current.find(f => f.label === dir && f.data.isDirectory)
                if (!found) return newFiles
                current = found.children
            }
            const index = current.findIndex(f => f.label === target)
            if (index !== -1) current.splice(index, 1)
            return newFiles
        })
    }

    /**
     * Handles console input commands
     * @param {string} input - Console input string
     */
    const handleConsoleInput = async (input) => {
        try {
            // Handle shell commands
            const shellCommands = {
                'author$': () => { 
                    setConsoleHistory(prev => [...prev, { type: 'output', content: AUTHOR }])
                    return true
                },
                'clear': () => {
                    setOutput('')
                    setError('')
                    setConsoleHistory([
                        { type: 'output', content: WELCOME_ASCII }
                    ])
                    return true
                },
                'ls': async () => {
                    if (!files || files.length === 0) {
                        setConsoleHistory(prev => [...prev, { type: 'output', content: 'No files found' }])
                        return true
                    }
                    const currentDirFiles = getCurrentDirectoryFiles(currentPath)
                    const fileList = currentDirFiles.map(f => f.label).join('\n')
                    setConsoleHistory(prev => [...prev, { type: 'output', content: fileList }])
                    return true
                },
                'mkdir': async (dirname) => {
                    if (!dirname) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: 'Directory name is required' }])
                        return true
                    }
                    const newFolder = {
                        key: `${currentPath.join('/')}/${dirname}`,
                        label: dirname,
                        data: { 
                            isDirectory: true,
                            content: '' 
                        },
                        children: []
                    }
                    addFileToPath(currentPath, newFolder)
                    setConsoleHistory(prev => [...prev, { type: 'output', content: `Created directory ${dirname}` }])
                    return true
                },
                'touch': async (filename) => {
                    if (!filename) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: 'File name is required' }])
                        return true
                    }
                    const newFile = {
                        key: `${currentPath.join('/')}/${filename}`,
                        label: filename,
                        data: { 
                            isDirectory: false,
                            content: '' 
                        }
                    }
                    addFileToPath(currentPath, newFile)
                    setConsoleHistory(prev => [...prev, { type: 'output', content: `Created file ${filename}` }])
                    return true
                },
                'cat': async (filename) => {
                    if (!filename) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: 'Please specify a file' }])
                        return true
                    }
                    const file = findFileInPath(currentPath, filename)
                    if (!file) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `File ${filename} not found` }])
                        return true
                    }
                    
                    if (file.data.isDirectory) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `${filename} is a directory` }])
                        return true
                    }
                    
                    // Access content directly from data
                    const content = file.data.content || ''
                    setConsoleHistory(prev => [...prev, { type: 'output', content }])
                    return true
                },
                'cd': async (path) => {
                    if (!path) {
                        setCurrentPath([]) // Go to root
                        return true
                    }
                    if (path === '..') {
                        if (currentPath.length > 0) {
                            setCurrentPath(prev => prev.slice(0, -1))
                        }
                        return true
                    }
                    
                    const targetDir = findFileInPath(currentPath, path)
                    if (!targetDir) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `Directory ${path} not found` }])
                        return true
                    }
                    
                    // Check if it's a directory either by isDirectory flag or presence of children
                    if (!targetDir.data?.isDirectory && !targetDir.children) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `${path} is not a directory` }])
                        return true
                    }
                    
                    setCurrentPath(prev => [...prev, path])
                    return true
                },
                'rm': async (flag, target) => {
                    if (!target && flag) {
                        target = flag
                        flag = ''
                    }
                    if (!target) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: 'Please specify a target' }])
                        return true
                    }
                    const isRecursive = flag === '-r' || flag === '-rf'
                    const file = findFileInPath(currentPath, target)
                    
                    if (!file) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `${target} not found` }])
                        return true
                    }
                    if (file.data.isDirectory && !isRecursive) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `Cannot remove ${target}: Is a directory. Use -r flag` }])
                        return true
                    }
                    
                    removeFileFromPath(currentPath, target)
                    setConsoleHistory(prev => [...prev, { type: 'output', content: `Removed ${target}` }])
                    return true
                },
                'pwd': async () => { // Print working directory
                    const path = currentPath.length > 0 ? '/' + currentPath.join('/') : '/'
                    setConsoleHistory(prev => [...prev, { type: 'output', content: path }])
                    return true
                },
                'echo': async (...rawArgs) => {
                    // rawArgs = something like ['Hello', 'world', '>', 'myfile.txt']
                    // or maybe 'echo Hello world > myfile.txt'

                    // 1) Combine everything into a single string
                    const inputString = rawArgs.join(' ');

                    // 2) Check if there's a '>' for redirection
                    const redirIndex = inputString.indexOf('>');
                    if (redirIndex === -1) {
                        // Just print to console if no file given
                        setConsoleHistory(prev => [...prev, { type: 'output', content: inputString }]);
                        return true;
                    }

                    // If we do find '>', separate the text from the filename
                    const parts = inputString.split('>');
                    const textToWrite = parts[0].trim();
                    const filename = parts[1].trim();

                    if (!filename) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: 'Missing filename after >' }]);
                        return true;
                    }

                    // 3) Find the file in the current path
                    const file = findFileInPath(currentPath, filename);
                    if (!file) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `File ${filename} not found` }]);
                        return true;
                    }
                    if (file.data.isDirectory) {
                        setConsoleHistory(prev => [...prev, { type: 'error', content: `${filename} is a directory` }]);
                        return true;
                    }

                    // 4) Write text to that file's data.content
                    file.data.content = textToWrite;

                    setConsoleHistory(prev => [...prev, { type: 'output', content: '' }]);
                    return true;
                },
                'help': async () => {
                    const helpText = `
                    Available commands:
                        clear            Clear the terminal
                        ls               List files
                        mkdir <dir>      Create directory
                        touch <file>     Create file
                        cat <file>       Show file contents
                        cd <dir>         Change directory
                        rm [-r] <target> Remove file or folder (-r for folder)
                        pwd              Print working directory
                        help             Show this help
                    `;
                    setConsoleHistory(prev => [...prev, { type: 'output', content: helpText }]);
                    return true;
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

    /**
     * Executes code in the editor
     * @returns {Promise<void>}
     */
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
            consoleHistory,
            pendingModification,
            setPendingModification
        }}>
            {children}
        </EditorContext.Provider>
    )
}


