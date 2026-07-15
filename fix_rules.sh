sed -i 's/allow get: if isVerified() && (resource.data.userId == request.auth.uid || isAdmin());/allow read: if isVerified();/g' /app/applet/firestore.rules
sed -i 's/allow list: if isVerified() && (resource.data.userId == request.auth.uid || isAdmin());//g' /app/applet/firestore.rules
