'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import '../tokens.css';
import '../theme.css';
import { ToastProvider } from './Feedback';
import { Avatar, Badge, Logo } from './Primitives';
import { Icon, IconName } from './Icon';
// Existing chrome from the app — reused so freelancer/client pages share the
// same navbar + footer as the rest of the product.
import FreelancerLayout from '../../layout/FreelancerLayout';
import ClientLayout from '../../layout/ClientLayout';
import Footer from '../../components/Footer/Footer';
import HomeNavbar from '../../components/Header/HomeNavbar';
import { footerClientConfig } from '../../utils/footer/footerClientConfig';

export type ServicesMode = 'freelancer' | 'client' | 'public';

// ServicesShell wraps every Services page with the right site chrome plus
// theme tokens and a toast host.
//   mode="freelancer"  -> FreelancerLayout (green navbar + footer)
//   mode="client"      -> ClientLayout    (navy navbar + footer, calls fetchProfile)
//   mode="public"      -> HomeNavbar + navy Footer (same navbar as /client home
//                         but skips fetchProfile so guests are not redirected)
export function ServicesShell({
  mode, children,
}: {
  mode: ServicesMode;
  children: React.ReactNode;
}) {
  if (mode === 'freelancer') {
    return (
      <FreelancerLayout>
        <ToastProvider>
          <div className="vj-page theme-freelancer">
            <div className="vj-page-pad">{children}</div>
          </div>
        </ToastProvider>
      </FreelancerLayout>
    );
  }
  if (mode === 'client') {
    return (
      <ClientLayout>
        <ToastProvider>
          <div className="vj-page theme-client">
            <div className="vj-page-pad">{children}</div>
          </div>
        </ToastProvider>
      </ClientLayout>
    );
  }
  // public
  return (
    <ToastProvider>
      <div className="vj-page theme-client" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <HomeNavbar />
        <main style={{ flex: 1 }}>
          <div className="vj-page-pad">{children}</div>
        </main>
        <Footer {...footerClientConfig} />
      </div>
    </ToastProvider>
  );
}

// AdminLayout: sidebar (#0d1119) + topbar. Not in the existing app, created here.
interface AdminNavItem { key: string; label: string; icon: IconName; route: string; disabled?: boolean }
const ADMIN_NAV: AdminNavItem[] = [
  { key: 'aoverview',  label: 'Overview',          icon: 'home',        route: '/admin' },
  { key: 'asvc',       label: 'Services Queue',    icon: 'list',        route: '/admin/services' },
  { key: 'adisputes',  label: 'Disputes',          icon: 'flag',        route: '/admin/disputes' },
  { key: 'acdisputes', label: 'Contract Disputes', icon: 'fileCheck',   route: '/admin/contract-disputes' },
  { key: 'ausers',     label: 'Users',             icon: 'users',       route: '/admin/users' },
  { key: 'aorders',    label: 'All Orders',        icon: 'shoppingBag', route: '/admin/orders' },
  { key: 'afinances',  label: 'Finances',          icon: 'dollar',      route: '/admin/finances' },
];

export function AdminLayout({
  title, children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const heading =
    title ??
    (pathname.startsWith('/admin/services') ? 'Service Review' :
     pathname.startsWith('/admin/contract-disputes') ? 'Contract Disputes' :
     pathname.startsWith('/admin/disputes') ? 'Disputes' :
     pathname.startsWith('/admin/users') ? 'Users' :
     pathname.startsWith('/admin/orders') ? 'All Orders' :
     pathname.startsWith('/admin/finances') ? 'Finances' :
     pathname === '/admin' ? 'Admin Overview' : 'Admin');

  const isActive = (route: string) =>
    route === '/admin' ? pathname === '/admin' : pathname.startsWith(route);

  return (
    <ToastProvider>
      <div className="vj-page theme-client" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className="vj-admin-grid">
          <aside className="vj-admin-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '4px 4px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Logo tone="client" inverted />
              <Badge tone="brand" dot={false} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', marginLeft: 'auto' }}>Admin</Badge>
            </div>
            {ADMIN_NAV.map(n => {
              const active = isActive(n.route);
              const item = (
                <span
                  key={n.key}
                  style={{
                    padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                    color: active ? '#fff' : n.disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    cursor: n.disabled ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                    transition: 'background 120ms var(--ease-out)',
                  }}
                >
                  <Icon name={n.icon} size={16} />
                  {n.label}
                  {n.disabled && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Soon</span>}
                </span>
              );
              return n.disabled ? item : (
                <Link key={n.key} href={n.route} prefetch={false} style={{ textDecoration: 'none' }}>{item}</Link>
              );
            })}
          </aside>
          <div className="vj-admin-main">
            <header className="vj-admin-topbar">
              <button
                className="vj-admin-menubtn"
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Icon name="menu" size={18} color="var(--fg-3)" />
              </button>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)' }}>{heading}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name="Admin" size={32} />
              </div>
            </header>
            <main>
              <div className="vj-page-pad">{children}</div>
            </main>
          </div>
        </div>
        {drawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 80, animation: 'vj-fade 160ms var(--ease-out)' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: 320,
                background: '#0d1119', padding: 20, overflow: 'auto',
                animation: 'vj-rise 220ms var(--ease-out)',
                display: 'flex', flexDirection: 'column', gap: 8, color: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Logo tone="client" inverted />
              </div>
              {ADMIN_NAV.map(n => {
                const active = isActive(n.route);
                if (n.disabled) {
                  return (
                    <span key={n.key} style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                      {n.label}
                    </span>
                  );
                }
                return (
                  <Link
                    key={n.key}
                    href={n.route}
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                      color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                    }}
                  >
                    <Icon name={n.icon} size={16} />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

// Routes Next.js navigation calls back to the design components' callback shape.
export function useNav(): (to: string) => void {
  const router = useRouter();
  return (to: string) => router.push(to);
}
