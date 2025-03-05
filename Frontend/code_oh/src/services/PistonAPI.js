

//  For connecting to the Piston API
// baseURL: 'https://emkc.org/api/v2/piston'
    
import axios from 'axios';
import { LANGUAGE_VERSIONS } from './languageVersions';

const API = axios.create({
    // baseURL: 'http://localhost:2000/api/v2'
    baseURL: 'https://emkc.org/api/v2/piston'
});

const getRuntimes = async () => {
    try {
        const response = await API.get('/runtimes');
        const latestVersions = {};
        
        response.data.forEach(runtime => {
            const language = runtime.language;
            const version = runtime.version;
            
            if (!latestVersions[language] || version > latestVersions[language]) {
                latestVersions[language] = version;
            }
        });
        
        return latestVersions;
    } catch (error) {
        console.error('Failed to fetch runtimes:', error);
        return LANGUAGE_VERSIONS;
    }
};

export const executeCode = async (language, sourceCode) => {
    try {
        const versions = await getRuntimes();
        
        if (language === 'python') {
            console.log('Detected Python code, checking imports...');
            const importMatches = sourceCode.match(/^(?:from|import)\s+(\w+)/gm) || [];
            console.log('Found imports:', importMatches);
            
            // Modified setup code to use the correct Python path
            const setupCode = `
import os
import site
import sys

# Add site-packages directory to Python path
site_packages = '/piston/packages/python/${versions.python}/lib/python3.9/site-packages'
if os.path.exists(site_packages):
    site.addsitedir(site_packages)
    sys.path.insert(0, site_packages)
`;
            sourceCode = setupCode + '\n' + sourceCode;
            
            // Install required packages
            for (const match of importMatches) {
                const pkg = match.split(/\s+/)[1];
                if (!['sys', 'os', 'math', 'time', 'random', 'site'].includes(pkg)) {
                    console.log(`Installing package: ${pkg}`);
                    try {
                        await installPackage(pkg, 'pip', versions.python);
                        console.log(`Successfully installed ${pkg}`);
                    } catch (error) {
                        console.error(`Failed to install ${pkg}:`, error);
                        throw error;
                    }
                }
            }
        }

        console.log('Executing code with version:', versions[language]);
        // const response = await API.post('/execute', {
        //     language: language,
        //     version: versions[language],
        //     files: [{
        //         name: `code.${language}`,
        //         content: sourceCode
        //     }],
        //     stdin: "",
        //     args: [],
        //     compile_timeout: 10000,
        //     run_timeout: 3000,
        //     env: {
        //         "PYTHONPATH": `/piston/packages/python/${versions.python}/lib/python3.9/site-packages`
        //     }
        // });
        const response = await API.post('/execute', {
            language: language,
            version: versions[language],
            files: [{
                name: `code.${language}`,
                content: sourceCode
            }],
            stdin: "",
            args: [],
            compile_timeout: 10000,
            run_timeout: 3000,
            compile_memory_limit: -1,
            run_memory_limit: -1,
            // Add network access flag
            network_disabled: false
        });
        return response.data;
    } catch (error) {
        console.error('Code execution failed:', error.response?.data || error);
        throw error;
    }
};

const installPackage = async (packageName, packageType, version) => {
    try {
        console.log(`Installing ${packageName} for Python ${version}`);
        const response = await API.post('/install-package', {
            package: packageName,
            type: packageType,
            version: version
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to install package ${packageName}:`, error.response?.data || error.message);
        throw error;
    }
};