


// baseURL: 'https://emkc.org/api/v2/piston'
    



import axios from 'axios';
import { LANGUAGE_VERSIONS } from './languageVersions';

const API = axios.create({
    baseURL: 'http://localhost:2000/api/v2'
});

// Fetch available runtimes from the API
const getRuntimes = async () => {
    try {
        const response = await API.get('/runtimes');
        const latestVersions = {};
        
        // Process runtimes to get latest versions for each language
        response.data.forEach(runtime => {
            const language = runtime.language;
            const version = runtime.version;
            
            // Update only if version is newer or language not yet recorded
            if (!latestVersions[language] || version > latestVersions[language]) {
                latestVersions[language] = version;
            }
        });
        
        return latestVersions;
    } catch (error) {
        console.error('Failed to fetch runtimes:', error);
        return LANGUAGE_VERSIONS; // Fallback to default versions
    }
};

export const executeCode = async (language, sourceCode) => {
    try {
        // Get latest runtime versions before execution
        const versions = await getRuntimes();
        
        const response = await API.post('/execute', {
            language: language,
            version: versions[language] || LANGUAGE_VERSIONS[language], // Fallback to default if not found
            files: [
                {
                    name: `code.${language}`,
                    content: sourceCode
                }
            ],
            stdin: "",
            args: [],
            compile_timeout: 10000,
            run_timeout: 3000
        });
        return response.data;
    } catch (error) {
        console.error('Code execution failed:', error);
        throw error;
    }
};

export { getRuntimes };