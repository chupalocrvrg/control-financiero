import re

with open('/app/applet/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

content = content.replace("  );\n}", "\n    </>\n  );\n}")

with open('/app/applet/src/pages/Settings.tsx', 'w') as f:
    f.write(content)

