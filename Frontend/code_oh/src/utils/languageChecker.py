import re


def detect_language(code):
    patterns = {
        # Python patterns
        r"\bdef\s+\w+\s*\(.*\):|class\s+\w+:|import\s+\w+|from\s+\w+\s+import": "Python",
        # JavaScript patterns
        r"function\s+\w+\s*\(.*\)|\bconst\s+|let\s+|var\s+|=>|import\s+.*\s+from": "JavaScript",
        # TypeScript patterns
        r"interface\s+\w+|type\s+\w+\s*=|export\s+type|:\s*\w+Type|<\w+>": "TypeScript",
        # Java patterns
        r"public\s+class\s+\w+|public\s+static\s+void\s+main|import\s+java\.": "Java",
        # C/C++ patterns
        r"#include\s*<\w+\.h>|\bint\s+main\s*\(|std::": "C/C++",
        # Go patterns
        r"package\s+main|func\s+main\s*\(\s*\)|import\s*\(.*\)": "Go",
        # Rust patterns
        r"fn\s+main\s*\(\s*\)|let\s+mut\s+|impl\s+|use\s+std::": "Rust",
        # Bash/Shell patterns
        r"#!/bin/bash|#!/usr/bin/env bash|\becho\s+|\bgrep\s+|\bawk\s+|\bsed\s+": "Bash",
        # PHP patterns
        r"<\?php|\becho\s+|\$\w+|\bnamespace\s+": "PHP",
        # Ruby patterns
        r'require\s+[\'"]\w+[\'"]|def\s+\w+\s*(\|.*\|)?|class\s+\w+\s*<': "Ruby",
        # HTML patterns
        r"<!DOCTYPE\s+html>|<html.*>|<body.*>|<script.*>": "HTML",
        # CSS patterns
        r"@media\s+|@import\s+|{\s*[\w-]+\s*:": "CSS",
        # SQL patterns
        r"SELECT\s+.*\s+FROM|CREATE\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+\s+SET": "SQL",
    }

    for pattern, lang in patterns.items():
        if re.search(pattern, code, re.MULTILINE | re.IGNORECASE):
            return lang

    return "Unknown"


text = """Input your code here
"""

print(detect_language(text))
