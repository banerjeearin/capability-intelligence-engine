import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/upload', label: 'Upload' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/chat', label: 'Chat' },
  { href: '/reports', label: 'Reports' }
];

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-4 text-slate-950">Capability Intelligence</span>
              <span className="block text-xs leading-4 text-slate-500">Executive Fit Engine</span>
            </span>
          </Link>
          <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto pb-1 lg:mx-0 lg:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 border-b border-slate-200 pb-4 sm:mb-6 sm:pb-5">
          <p className="eyebrow mb-2">Operating workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
