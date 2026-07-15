import re

with open('/app/applet/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

content = content.replace("  return (\n\n      {positionConfirmTimer", "  return (\n    <>\n      {positionConfirmTimer")
content = content.replace("            </section>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}", "            </section>\n          )}\n        </div>\n      </div>\n    </div>\n    </>\n  );\n}")

with open('/app/applet/src/pages/Settings.tsx', 'w') as f:
    f.write(content)

