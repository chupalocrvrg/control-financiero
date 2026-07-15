import re

with open('/app/applet/src/pages/Login.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const { user, login } = useAuth();", "  const { user, profile, loading, login } = useAuth();")

content = content.replace("""  if (user) {
    return <Navigate to="/" replace />;
  }""", """  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Verificando Credenciales</h2>
        <p className="text-neutral-500 text-sm mt-2 font-medium">Control 360°</p>
      </div>
    );
  }

  if (user && profile) {
    return <Navigate to="/" replace />;
  }""")

with open('/app/applet/src/pages/Login.tsx', 'w') as f:
    f.write(content)

