const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  'async function startServer() {\n  const app = express();\n  const PORT = 3000;\n\n  // Middleware to parse incoming JSON bodies\n  app.use(express.json());',
  'export const app = express();\nconst PORT = 3000;\n\n// Middleware to parse incoming JSON bodies\napp.use(express.json());'
);

code = code.replace(
  '  // Service Routing',
  '  // Service Routing\nasync function startServer() {'
);

code = code.replace(
  '}\n\nstartServer();',
  '}\n\nif (!process.env.VERCEL) {\n  startServer();\n}\n\nexport default app;'
);

fs.writeFileSync('server.ts', code);
