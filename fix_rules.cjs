const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  'return isSignedIn() && request.auth.token.email_verified == true;',
  'return isSignedIn(); // Relaxed email_verified for debugging'
);
fs.writeFileSync('firestore.rules', rules);
