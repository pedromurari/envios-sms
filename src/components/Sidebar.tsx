'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  ListOrdered,
  Settings,
  MessageSquare,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns/new', label: 'Nova Campanha', icon: Send },
  { href: '/campaigns', label: 'Campanhas', icon: ListOrdered },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="font-bold text-sm leading-tight">Envios SMS</p>
            <p className="text-slate-400 text-xs">FacilitaMóvel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs text-center">
          API: facilitamovel.com.br
        </p>
      </div>
    </aside>
  );
}
