#!/usr/bin/env python3
"""Safely migrate motion/react to gsap in TypeScript/TSX files."""

import re
import sys
import os

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace imports
    content = re.sub(
        r"import \{ motion, AnimatePresence \} from 'motion/react';",
        "import gsap from 'gsap';",
        content
    )
    content = re.sub(
        r"import \{ motion \} from 'motion/react';",
        "import gsap from 'gsap';",
        content
    )

    # Replace motion tags: <motion.div -> <div, </motion.div> -> </div>
    content = re.sub(r'<motion\.', '<', content)
    content = re.sub(r'</motion\.', '</', content)

    # Remove motion-specific props (handle multi-line)
    # These props can span multiple lines
    props_to_remove = [
        'initial', 'animate', 'exit', 'transition',
        'whileHover', 'whileTap', 'whileInView',
        'viewport', 'variants', 'layout',
    ]

    for prop in props_to_remove:
        # Match prop={...} where {...} can contain nested braces
        # This handles both single-line and multi-line props
        pattern = r'\s+' + prop + r'=\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}'
        content = re.sub(pattern, '', content)

    # Remove AnimatePresence tags
    content = re.sub(r'<AnimatePresence[^>]*>\s*', '', content)
    content = re.sub(r'\s*</AnimatePresence>', '', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate-motion.py <file_or_directory>")
        sys.exit(1)

    target = sys.argv[1]
    migrated = 0

    if os.path.isfile(target):
        if migrate_file(target):
            print(f"Migrated: {target}")
            migrated += 1
    elif os.path.isdir(target):
        for root, dirs, files in os.walk(target):
            for f in files:
                if f.endswith('.tsx') or f.endswith('.ts'):
                    filepath = os.path.join(root, f)
                    if migrate_file(filepath):
                        print(f"Migrated: {filepath}")
                        migrated += 1

    print(f"\nTotal files migrated: {migrated}")

if __name__ == '__main__':
    main()
