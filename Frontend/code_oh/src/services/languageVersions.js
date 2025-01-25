
// TODO: Add updated versions for all languages base on piston api
export const LANGUAGE_VERSIONS = {
    python: '3.10.0',
    javascript: 'node-18.15.0',
    java: '15.0.2',
    typescript: '5.0.0',
    csharp: '6.12.0',
    php: '8.2.3',
    cpp: '11.2.0',
    c: '11.2.0'


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

echo "Hello, World!";`

}