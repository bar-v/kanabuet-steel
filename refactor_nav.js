const fs = require('fs');
const path = require('path');

const ownerFiles = [
  'app/dashboard/projects/page.tsx',
  'app/dashboard/projects/detail/page.tsx',
  'app/dashboard/materials/page.tsx',
  'app/dashboard/evaluation/page.tsx'
];

const supervisorFiles = [
  'app/dashboard/supervisor/page.tsx',
  'app/dashboard/supervisor/progress/page.tsx',
  'app/dashboard/supervisor/projects/detail/page.tsx'
];

function refactorFile(filepath, role) {
  const fullPath = path.join(__dirname, filepath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${fullPath} - Not found`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove local NAV array
  const navRegex = /\/\/ ── Nav ───────────────────────────────────────────────────────[\s\S]*?\];/g;
  const navRegexAlt = /const NAV = \[[\s\S]*?\];/g;
  
  const navImport = role === 'owner' 
    ? `import { OWNER_NAV, isNavActive } from "@/lib/config/navigation";`
    : `import { SUPERVISOR_NAV, isNavActive } from "@/lib/config/navigation";`;
    
  if (content.match(navRegex)) {
    content = content.replace(navRegex, navImport);
  } else if (content.match(navRegexAlt)) {
    content = content.replace(navRegexAlt, navImport);
  } else {
    // maybe already replaced or no nav array
  }

  // Update useRouter to include usePathname
  if (content.includes('useRouter } from "next/navigation"')) {
    content = content.replace('useRouter } from "next/navigation"', 'useRouter, usePathname } from "next/navigation"');
  }

  // Add usePathname hook
  if (content.includes('const router = useRouter();') && !content.includes('const pathname = usePathname();')) {
    content = content.replace('const router = useRouter();', 'const router = useRouter();\n  const pathname = usePathname();');
  }

  // Replace NAV.map loop
  const navMapRegex = /<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">[\s\S]*?<\/nav>/g;
  const navName = role === 'owner' ? 'OWNER_NAV' : 'SUPERVISOR_NAV';
  
  const newNavLoop = `<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {${navName}.map(({ label, Icon, href, matchPatterns }) => {
            const active = isNavActive(pathname, href, matchPatterns);
            return (
              <button
                key={label}
                onClick={() => { setSidebarOpen(false); router.push(href); }}
                className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
                  \${active
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                    : "hover:bg-slate-100 hover:text-slate-900"
                  }\`}
                style={!active ? { color: C.subtext } : undefined}
              >
                <Icon size={17} style={!active ? { color: C.muted } : undefined} className={active ? "text-orange-400" : ""} />
                {label}
              </button>
            );
          })}
        </nav>`;

  content = content.replace(navMapRegex, newNavLoop);

  // For supervisor files, remove local SVG icons inside the sidebar loop if any
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${filepath}`);
}

ownerFiles.forEach(f => refactorFile(f, 'owner'));
supervisorFiles.forEach(f => refactorFile(f, 'supervisor'));
