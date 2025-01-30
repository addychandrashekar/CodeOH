
// TODO: Add updated versions for all languages base on piston api
// Fetch all the versions from the piston api using : https://emkc.org/api/v2/piston/runtimes
export const LANGUAGE_VERSIONS = {
    python: '3.10.0',
    javascript: '18.15.0',
    java: '15.0.2',
    typescript: '5.0.3',
    csharp: '6.12.0',
    php: '8.2.3',
    cpp: '10.2.0',
    c: '10.2.0',
    dart: '2.15.0'


}

export const CODE_SNIPPETS = {
    python: `
print('Hello, World!')`,

    javascript: `
console.log('Hello, World!')`,

    java: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,

    typescript: `
console.log('Hello, World!')`,

    cpp: `
#include <iostream>

int main() {
    std::cout << "Hello, World!";
    return 0;
}`,

    c: `
#include <stdio.h>

int main() {
    printf("Hello, World!");
    return 0;
}`,

    csharp: `
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,

    php: `
<?php

echo "Hello, World!";`,
    
    dart: `
void main() {

    print('Hello, World!');
}`,

}


export const LANGUAGE_ICONS = {
  'cpp': 'https://cdn-icons-png.flaticon.com/512/6132/6132222.png',
  'csharp': 'https://cdn-icons-png.flaticon.com/512/6132/6132221.png',
  'c': 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png',
  'py': 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png',
  'ts': 'https://cdn-icons-png.flaticon.com/512/5968/5968381.png',
  'java': 'https://cdn-icons-png.flaticon.com/512/226/226777.png',
  'js': 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
  'php': 'https://cdn-icons-png.flaticon.com/512/5968/5968332.png'
}

// export const FOLDER_FILE_ICONS = {
//     folder: 'https://www.flaticon.com/free-icon/open-folder_10701617',
//     // file: 'https://cdn-icons-png.flaticon.com/512/633/633624.png'
// }

export const WELCOME_ASCII =
    `
                            ▄████▄   ▒█████  ▓█████▄ ▓█████     ▒█████   ██░ ██ 
                            ▒██▀ ▀█  ▒██▒  ██▒▒██▀ ██▌▓█   ▀    ▒██▒  ██▒▓██░ ██▒
                            ▒▓█    ▄ ▒██░  ██▒░██   █▌▒███      ▒██░  ██▒▒██▀▀██░
                            ▒▓▓▄ ▄██▒▒██   ██░░▓█▄   ▌▒▓█  ▄    ▒██   ██░░▓█ ░██ 
                            ▒ ▓███▀ ░░ ████▓▒░░▒████▓ ░▒████▒   ░ ████▓▒░░▓█▒░██▓
                            ░ ░▒ ▒  ░░ ▒░▒░▒░  ▒▒▓  ▒ ░░ ▒░ ░   ░ ▒░▒░▒░  ▒ ░░▒░▒
                            ░  ▒     ░ ▒ ▒░  ░ ▒  ▒  ░ ░  ░     ░ ▒ ▒░  ▒ ░▒░ ░
                            ░        ░ ░ ░ ▒   ░ ░  ░    ░      ░ ░ ░ ▒   ░  ░░ ░
                            ░ ░          ░ ░     ░       ░  ░       ░ ░   ░  ░  ░
                            ░                  ░                                 
Welcome to Code-oh! This is a simple online code editor that supports multiple programming languages.
Use command \`author$\` to know more about the authors.
Use command \`help\` to get started.
    `

export const AUTHOR = 
    `
               Authors:
            * Adewale Adenle
            * Shristi Keshri
            * Xiaoxing Chen
            * Adithya Chandrashekar
    `