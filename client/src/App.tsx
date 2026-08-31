import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Providers } from '@/pages/Providers';
import { ApiKeys } from '@/pages/ApiKeys';
import { Logs } from '@/pages/Logs';
import { Scores } from '@/pages/Scores';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Server, Key, FileText, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/providers', label: 'Providers', icon: Server },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/scores', label: 'Scores', icon: BarChart3 },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">FreeLLM</h1>
        <p className="text-sm text-muted-foreground">Admin Panel</p>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/scores" element={<Scores />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
