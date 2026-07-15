sed -i -e '/{ name: '\''Panel Principal'\'', href: '\'\/admin\/panel\'', icon: LayoutDashboard },/d' \
       -e '/{ name: '\''Notificaciones'\'', href: '\'\/admin\/notifications\'', icon: Bell },/c\
        { name: '\''Usuarios'\'', href: '\''/admin/users'\'', icon: Users },\
        { name: '\''Asignación / Migración'\'', href: '\''/admin/migration'\'', icon: ArrowLeftRight },\
        { name: '\''Versiones'\'', href: '\''/admin/versions'\'', icon: Clock },\
        { name: '\''Auditoría'\'', href: '\''/admin/audit'\'', icon: ShieldCheck },\
        { name: '\''Papelera'\'', href: '\''/admin/trash'\'', icon: Trash2 },\
        { name: '\''Notificaciones'\'', href: '\''/admin/notifications'\'', icon: Bell },' /app/applet/src/components/Layout.tsx
