import re

with open('/app/applet/src/components/Layout.tsx', 'r') as f:
    content = f.read()

old_effect = """  useEffect(() => {
    if (isGlass) {
      document.documentElement.classList.add('theme-glass');
    } else {
      document.documentElement.classList.remove('theme-glass');
    }
    return () => document.documentElement.classList.remove('theme-glass');
  }, [isGlass]);"""

new_effect = """  useEffect(() => {
    if (isGlass) {
      document.documentElement.classList.add('theme-glass');
      if (settings.uiStyle === 'liquid-glass') {
        document.documentElement.classList.add('theme-liquid-glass');
      } else {
        document.documentElement.classList.remove('theme-liquid-glass');
      }
    } else {
      document.documentElement.classList.remove('theme-glass', 'theme-liquid-glass');
    }
    return () => document.documentElement.classList.remove('theme-glass', 'theme-liquid-glass');
  }, [isGlass, settings.uiStyle]);"""

content = content.replace(old_effect, new_effect)

with open('/app/applet/src/components/Layout.tsx', 'w') as f:
    f.write(content)

