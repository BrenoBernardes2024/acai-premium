import os

file_path = r'c:\Users\PC\Downloads\Açaí Premium - O Melhor Açaí da Cidade_files\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all relative paths that point to the folder itself
content = content.replace('./Açaí Premium - O Melhor Açaí da Cidade_files/', './')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement successful")
