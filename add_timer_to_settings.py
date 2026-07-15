import re

with open('/app/applet/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

timer_states = """  const [positionConfirmTimer, setPositionConfirmTimer] = useState<number | null>(null);
  const [previousMenuPosition, setPreviousMenuPosition] = useState(settings.menuPosition);
  const [timeLeft, setTimeLeft] = useState(0);

  const handlePositionChange = (newPos: 'left' | 'right' | 'top' | 'bottom') => {
    if (newPos === (settings.menuPosition || 'left')) return;
    setPreviousMenuPosition(settings.menuPosition || 'left');
    updateSettings({ menuPosition: newPos });
    
    setTimeLeft(15);
    if (positionConfirmTimer) clearInterval(positionConfirmTimer);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setPositionConfirmTimer(interval as any);
  };

  useEffect(() => {
    if (timeLeft === 0 && positionConfirmTimer) {
       clearInterval(positionConfirmTimer);
       setPositionConfirmTimer(null);
       updateSettings({ menuPosition: previousMenuPosition });
       showToast("Se restableció la ubicación anterior", "info");
    }
  }, [timeLeft, positionConfirmTimer, previousMenuPosition, updateSettings, showToast]);

  const confirmPositionChange = () => {
    if (positionConfirmTimer) {
      clearInterval(positionConfirmTimer);
      setPositionConfirmTimer(null);
      setTimeLeft(0);
      showToast("Ubicación guardada", "success");
    }
  };

  const cancelPositionChange = () => {
    if (positionConfirmTimer) {
      clearInterval(positionConfirmTimer);
      setPositionConfirmTimer(null);
      setTimeLeft(0);
      updateSettings({ menuPosition: previousMenuPosition });
      showToast("Se restableció la ubicación anterior", "info");
    }
  };

  useEffect(() => {
    return () => {
      if (positionConfirmTimer) clearInterval(positionConfirmTimer);
    };
  }, [positionConfirmTimer]);
"""

content = content.replace("  const [backupPin, setBackupPin] = useState('');", "  const [backupPin, setBackupPin] = useState('');\n" + timer_states)

# Replace the onClick handler for menuPosition
content = content.replace("onClick={() => updateSettings({ menuPosition: pos.value as any })}", "onClick={() => handlePositionChange(pos.value as any)}")

with open('/app/applet/src/pages/Settings.tsx', 'w') as f:
    f.write(content)

