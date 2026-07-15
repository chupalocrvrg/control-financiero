import re

with open('/app/applet/src/index.css', 'r') as f:
    content = f.read()

liquid_glass_css = """
/* Liquid Glass Additional Styles */
html.theme-liquid-glass .bg-white {
  background-color: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(60px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(60px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5), 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
}

html.dark.theme-liquid-glass .dark\:bg-neutral-900,
html.dark.theme-liquid-glass .dark\:bg-neutral-800 {
  background-color: rgba(10, 10, 10, 0.3) !important;
  backdrop-filter: blur(60px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(60px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.5) !important;
}
"""

content = content + "\n" + liquid_glass_css

with open('/app/applet/src/index.css', 'w') as f:
    f.write(content)

