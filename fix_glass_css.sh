sed -i 's/rgba(255, 255, 255, 0.45)/rgba(255, 255, 255, 0.65)/g' /app/applet/src/index.css
sed -i 's/blur(24px)/blur(40px) saturate(150%)/g' /app/applet/src/index.css
sed -i 's/rgba(15, 15, 15, 0.45)/rgba(20, 20, 20, 0.5)/g' /app/applet/src/index.css
sed -i 's/border-color: rgba(255, 255, 255, 0.5) !important;/border: 1px solid rgba(255, 255, 255, 0.8) !important;/g' /app/applet/src/index.css
sed -i 's/border-color: rgba(255, 255, 255, 0.08) !important;/border: 1px solid rgba(255, 255, 255, 0.1) !important;/g' /app/applet/src/index.css
sed -i '/border: 1px solid rgba(255, 255, 255, 0.8)/a\
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;' /app/applet/src/index.css
