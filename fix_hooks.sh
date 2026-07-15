sed -i '231,239d' /app/applet/src/components/Layout.tsx

sed -i '/if (loading) {/i\
  const isGlass = settings.uiStyle === '\''glass'\'';\
  useEffect(() => {\
    if (isGlass) {\
      document.documentElement.classList.add('\''theme-glass'\'');\
    } else {\
      document.documentElement.classList.remove('\''theme-glass'\'');\
    }\
    return () => document.documentElement.classList.remove('\''theme-glass'\'');\
  }, [isGlass]);\
' /app/applet/src/components/Layout.tsx
