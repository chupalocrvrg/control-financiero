import fs from 'fs';

const filePath = 'src/components/Layout.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldSidebarHeader = `<span className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
            {profile?.name || 'Control 360°'}
          </span>`;

const newSidebarHeader = `<div className="flex flex-col truncate">
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
              {profile?.name || 'Control 360°'}
            </span>
            {(!profile?.name) && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">by Trennd</span>}
          </div>`;

content = content.replace(oldSidebarHeader, newSidebarHeader);

const oldMobileHeader = `<span className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {profile?.name || 'Control 360°'}
          </span>`;

const newMobileHeader = `<div className="flex flex-col truncate">
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
              {profile?.name || 'Control 360°'}
            </span>
            {(!profile?.name) && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">by Trennd</span>}
          </div>`;

content = content.replace(oldMobileHeader, newMobileHeader);

fs.writeFileSync(filePath, content);
console.log("Updated Layout.tsx");
