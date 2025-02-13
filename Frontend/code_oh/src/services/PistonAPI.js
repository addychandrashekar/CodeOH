

//  For connecting to the Piston API
// baseURL: 'https://emkc.org/api/v2/piston'
    

import axios from 'axios';
import { LANGUAGE_VERSIONS } from './languageVersions';

const API = axios.create({
    baseURL: 'http://localhost:2000/api/v2'
});

// Check installed packages
const checkPackages = async () => {
    try {
        const response = await API.get('/packages');
        console.log('Currently installed packages:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to check packages:', error.response?.data || error.message);
        return [];
    }
};

// Fetch available runtimes from the API
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
            
            const setupCode = `
import os
import site
import sys

package_path = '/piston/packages/python/libs'
if os.path.exists(package_path):
    site.addsitedir(package_path)
    sys.path.insert(0, package_path)
`;
            sourceCode = setupCode + '\n' + sourceCode;
            
            for (const match of importMatches) {
                const pkg = match.split(/\s+/)[1];
                if (!['sys', 'os', 'math', 'time', 'random', 'site'].includes(pkg)) {
                    console.log(`Installing package: ${pkg}`);
                    try {
                        await installPackage(pkg, 'pip');
                        console.log(`Successfully installed ${pkg}`);
                    } catch (error) {
                        console.error(`Failed to install ${pkg}:`, error);
                        throw error;
                    }
                }
            }
        }

        console.log('Executing code with version:', versions[language]);
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
            env: {
                "PYTHONPATH": "/piston/packages/python/libs"
            }
        });

        if (response.data.run) {
            if (response.data.run.stderr) {
                console.error('Execution stderr:', response.data.run.stderr);
            }
            console.log('Execution stdout:', response.data.run.stdout);
        }
        
        return response.data;
    } catch (error) {
        console.error('Code execution failed:', error.response?.data || error);
        throw error;
    }
};

const installPackage = async (packageName, packageType) => {
    try {
        console.log(`Attempting to install ${packageName} using ${packageType}`);
        const response = await API.post('/install-package', {
            package: packageName,
            type: packageType
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to install package ${packageName}:`, error.response?.data || error.message);
        throw error;
    }
};