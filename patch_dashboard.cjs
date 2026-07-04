const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the condition in Dashboard.tsx
code = code.replace(
  `        {user?.email === 'marcelogutama3eroa@gmail.com' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allCommerceData.map((data, idx) => (
              <CommerceCard key={idx} data={data} />
            ))}
          </div>
        ) : (
          <div>
            {commerceData ? (
              <CommerceCard data={commerceData} />
            ) : (
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center text-neutral-500">
                No hay un perfil de empleado asignado a tu correo electrónico.
              </div>
            )}
          </div>
        )}`,
  `        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allCommerceData.map((data, idx) => (
            <CommerceCard key={idx} data={data} />
          ))}
        </div>`
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched Dashboard.tsx for admin view');
