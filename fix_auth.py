import re

with open('/app/applet/src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

fallback_creation = """          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setActualProfile(data);
            setProfile(data);
            
            // Auto-verify if today is the same as lastPinEntry and within timeout
            if (data.lastPinEntry) {
              let lastEntry: Date;
              if (typeof data.lastPinEntry === 'string') {
                lastEntry = parseISO(data.lastPinEntry);
              } else if ((data.lastPinEntry as any)?.toDate) {
                lastEntry = (data.lastPinEntry as any).toDate();
              } else {
                lastEntry = new Date(data.lastPinEntry);
              }
              const now = new Date();
              const diffMins = (now.getTime() - lastEntry.getTime()) / 60000;
              
              if (now.toDateString() === lastEntry.toDateString() && diffMins < (data.pinInactivityLimit || 1440)) {
                setSessionVerified(true);
              }
            }
          } else {
            console.log("Profile not found locally, creating client-side fallback...");
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Usuario Nuevo',
              role: 'USER',
              status: 'ENABLED',
              hasCompletedOnboarding: false,
              subscriptionEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString()
            };
            try {
              const { setDoc } = await import('firebase/firestore');
              await setDoc(docRef, defaultProfile);
              setActualProfile(defaultProfile);
              setProfile(defaultProfile);
            } catch (err) {
              console.error("Could not create fallback profile", err);
              setActualProfile(null);
              setProfile(null);
            }
          }"""

old_block = """          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setActualProfile(data);
            setProfile(data);
            
            // Auto-verify if today is the same as lastPinEntry and within timeout
            if (data.lastPinEntry) {
              let lastEntry: Date;
              if (typeof data.lastPinEntry === 'string') {
                lastEntry = parseISO(data.lastPinEntry);
              } else if ((data.lastPinEntry as any)?.toDate) {
                lastEntry = (data.lastPinEntry as any).toDate();
              } else {
                lastEntry = new Date(data.lastPinEntry);
              }
              const now = new Date();
              const diffMins = (now.getTime() - lastEntry.getTime()) / 60000;
              
              if (now.toDateString() === lastEntry.toDateString() && diffMins < (data.pinInactivityLimit || 1440)) {
                setSessionVerified(true);
              }
            }
          } else {
            setActualProfile(null);
            setProfile(null);
          }"""

content = content.replace(old_block, fallback_creation)

with open('/app/applet/src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)

