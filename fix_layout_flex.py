import re

with open('/app/applet/src/components/Layout.tsx', 'r') as f:
    content = f.read()

old_container = """  const containerClass = cn(
    "h-screen overflow-hidden flex flex-col transition-colors duration-300", settings.menuPosition === 'right' ? "md:flex-row-reverse" : "md:flex-row",
    isGlass 
      ? "bg-[#f0f4f8] dark:bg-[#0a0a0a] relative overflow-hidden" 
      : "bg-neutral-50 dark:bg-neutral-950"
  );"""

new_container = """  const containerClass = cn(
    "h-screen overflow-hidden flex flex-col transition-colors duration-300", 
    pos === 'right' ? "md:flex-row-reverse" : 
    pos === 'top' ? "md:flex-col" : 
    pos === 'bottom' ? "md:flex-col-reverse" : 
    "md:flex-row",
    (isGlass || settings.uiStyle === 'liquid-glass')
      ? "bg-[#f0f4f8] dark:bg-[#0a0a0a] relative overflow-hidden" 
      : "bg-neutral-50 dark:bg-neutral-950"
  );"""

content = content.replace(old_container, new_container)

with open('/app/applet/src/components/Layout.tsx', 'w') as f:
    f.write(content)

