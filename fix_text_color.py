import re

with open('/app/applet/src/index.css', 'r') as f:
    content = f.read()

# Change the color of text-neutral-500 in dark glass to be more readable
content = content.replace("color: rgba(255, 255, 255, 0.7) !important;", "color: rgba(255, 255, 255, 0.9) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.5);")

# Also add some shadow to main text in dark glass
content = content.replace("color: rgba(255, 255, 255, 0.9) !important;", "color: #ffffff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.6);")

# Let's ensure text-neutral-400 is also overridden to be readable
additional_css = """
html.dark.theme-glass .text-neutral-400, 
html.dark.theme-glass .text-neutral-500,
html.dark.theme-glass .dark\\:text-neutral-400,
html.dark.theme-glass .dark\\:text-neutral-500 {
  color: rgba(255, 255, 255, 0.95) !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8) !important;
}

html.dark.theme-glass h1, 
html.dark.theme-glass h2, 
html.dark.theme-glass h3, 
html.dark.theme-glass p,
html.dark.theme-glass span,
html.dark.theme-glass div {
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

html.dark.theme-liquid-glass .text-neutral-400, 
html.dark.theme-liquid-glass .text-neutral-500,
html.dark.theme-liquid-glass .dark\\:text-neutral-400,
html.dark.theme-liquid-glass .dark\\:text-neutral-500 {
  color: rgba(255, 255, 255, 1) !important;
  text-shadow: 0 1px 4px rgba(0,0,0,0.9) !important;
}
"""

content = content + "\n" + additional_css

with open('/app/applet/src/index.css', 'w') as f:
    f.write(content)

