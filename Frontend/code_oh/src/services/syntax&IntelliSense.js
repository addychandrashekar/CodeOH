import { languages } from 'monaco-editor'



export const configureEditor = (editor, monaco, language) => {
    // Basic editor configurations for all languages
    editor.updateOptions({
        minimap: { enabled: true },
        fontSize: 14,
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        tabSize: 4,
        wordWrap: 'on',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        guides: {
            bracketPairs: true,
            indentation: true
        }
    })

    // Configure language-specific settings
    switch (language) {
        case 'javascript':
        case 'typescript':
            configureJavaScript(monaco)
            break
        case 'python':
            configurePython(monaco)
            break
        case 'java':
            configureJava(monaco)
            break

        case 'dart':
            configureDart(monaco)
            break
        case 'php':
            configurePhp(monaco)
            break
        case 'c':
            configureC(monaco)
            break
        case 'cpp':
        case 'c++':
            configureCpp(monaco)
            break
        case 'csharp':
        case 'c#':
            configureCsharp(monaco)
            break
        // Add more language configurations as needed
    }
}

const configureJavaScript = (monaco) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,

        noSyntaxValidation: false,
    })

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
        typeRoots: ["node_modules/@types"]
    })
}
const configurePython = (monaco) => {
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'print',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'print(${1:value})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Print a value to the console'
                },
                {
                    label: 'def',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'def ${1:function_name}(${2:parameters}):',
                        '\t${3:pass}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Define a new function'
                }
            ]
        })
    })
}


const configureJava = (monaco) => {
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'sout',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'System.out.println(${1:value});',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Print to console'
                },
                {
                    label: 'psvm',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'public static void main(String[] args) {',
                        '\t${1}',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Public static void main'
                }
            ]
        })
    })
}

const configureDart = (monaco) => {
    // Basic snippet completions for Dart
    monaco.languages.registerCompletionItemProvider('dart', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'void main() {',
                        '\t${1:print("Hello, Dart!");}',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Main entry point'
                },
                {
                    label: 'class',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'class ${1:ClassName} {',
                        '\t${2}',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Define a Dart class'
                }
            ]
        })
    })
}

const configurePhp = (monaco) => {
    // Basic snippet completions for PHP
    monaco.languages.registerCompletionItemProvider('php', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'echo',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'echo "${1:message}";',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Print a message to output'
                },
                {
                    label: 'phpfunction',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'function ${1:functionName}(${2:$args}) {',
                        '\t${3:// code}',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Define a PHP function'
                }
            ]
        })
    })
}

const configureC = (monaco) => {
    // Basic snippet completions for C
    monaco.languages.registerCompletionItemProvider('c', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        '#include <stdio.h>',
                        '',
                        'int main() {',
                        '\t${1:printf("Hello, C!\\n");}',
                        '\treturn 0;',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Basic main function'
                }
            ]
        })
    })
}

const configureCpp = (monaco) => {
    // Basic snippet completions for C++
    monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        '#include <iostream>',
                        'using namespace std;',
                        '',
                        'int main() {',
                        '\tcout << "Hello, C++!" << endl;',
                        '\treturn 0;',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Basic main function'
                }
            ]
        })
    })
}
const configureCsharp = (monaco) => {
    // Basic snippet completions for C#
    monaco.languages.registerCompletionItemProvider('csharp', {
        provideCompletionItems: () => ({
            suggestions: [
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'using System;',
                        '',
                        'public class Program {',
                        '\tpublic static void Main(string[] args) {',
                        '\t\tConsole.WriteLine("Hello, C#");',
                        '\t}',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Basic main method in C#'
                }
            ]
        })
    })
}
