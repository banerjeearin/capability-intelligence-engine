import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Command' },
  { href: '/dashboard', label: 'Intel' },
  { href: '/upload', label: 'Evidence' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/chat', label: 'Copilot' },
  { href: '/reports', label: 'Briefings' }
];

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0d10]/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
          <span className="rounded-md border border-violet-400/40 bg-violet-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-violet-200">
            Executive Intelligence Terminal
          </span>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-slate-300 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {children}
      </main>
    </div>
  );
}
