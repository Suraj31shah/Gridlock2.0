import os
import glob

files = glob.glob('d:/gridlock2/frontend/src/components/*.jsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if "import { API_BASE }" not in content:
        content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport { API_BASE } from '../config';")
    
    content = content.replace("'http://localhost:8000/", "`${API_BASE}/")
    content = content.replace("'http://localhost:8000", "`${API_BASE}")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
