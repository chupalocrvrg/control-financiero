import re

with open('/app/applet/src/firebase.ts', 'r') as f:
    content = f.read()

content = content.replace("import { getAuth } from 'firebase/auth';", "import { getAuth } from 'firebase/auth';\nimport { getStorage } from 'firebase/storage';")
content = content + "\nexport const storage = getStorage(app);\n"

with open('/app/applet/src/firebase.ts', 'w') as f:
    f.write(content)

