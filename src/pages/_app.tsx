// src/pages/_app.tsx
import '../styles/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { UserRole } from '@/lib/user/type';
import { persistor, store } from '@/store';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { RoleBasedRoute } from '../components/RoleBasedRoute';
import { AuthProvider } from '../providers/AuthProvider';

const protectedPaths = [
  '/dashboard',
  '/profile',
  '/admin',
  '/attendance',
  '/transaction',
  '/admin/users',
  '/admin/users/leads',
  '/admin/announcements',
  '/admin/content',
  '/library',
  '/shift',
  '/committee/reports',
  // '/announcements',
];

const roleBasedRoutes = {
  [UserRole.FINANCE_ADMIN]: [
    '/transaction',
    '/admin/users',
    '/shift',
    '/admin/content',
  ],
  [UserRole.ATTENDANCE_ADMIN]: [
    '/attendance',
    '/admin/users',
    '/shift',
    '/admin/content',
  ],
  [UserRole.SUPER_ADMIN]: [
    '/admin',
    '/attendance',
    '/transaction',
    '/admin/users',
    '/admin/users/leads',
    '/admin/announcements',
    '/admin/content',
    '/library',
    '/shift',
    '/committee/reports',
  ],
  [UserRole.USER]: ['/profile'],
  [UserRole.LEAD]: ['/library', '/performance', '/shift'], // Allow LEAD role to access library and shifts
};

export default function App({ Component, pageProps, router }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  const isProtectedRoute = protectedPaths.some((path) =>
    router.pathname.startsWith(path),
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {isProtectedRoute ? (
              <ProtectedRoute>
                <RoleBasedRoute
                  allowedRoles={Object.entries(roleBasedRoutes)
                    .filter(([_, paths]) =>
                      paths.some((path) => router.pathname.startsWith(path)),
                    )
                    .map(([role]) => role as UserRole)}
                  redirectPath="/auth/login"
                >
                  <Component {...pageProps} />
                </RoleBasedRoute>
              </ProtectedRoute>
            ) : (
              <Component {...pageProps} />
            )}
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
