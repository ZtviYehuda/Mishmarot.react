import os

path = 'app'
replacements = {
    '❌': '[ERROR]',
    '✅': '[SUCCESS]',
    '⚠️': '[WARNING]',
    '🐞': '[BUG]',
    '💡': '[IDEA]',
    '✨': '[NEW]'
}

for root, dirs, files in os.walk(path):
    for file in files:
        if file.endswith('.py'):
            fpath = os.path.join(root, file)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                for k, v in replacements.items():
                    content = content.replace(k, v)
                
                if content != original:
                    with open(fpath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed emojis in {fpath}")
            except Exception as e:
                print(f"Could not process {fpath}: {e}")
