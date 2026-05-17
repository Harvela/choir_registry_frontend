'use client';

import type { ReactNode } from 'react';
import React from 'react';

import Layout from '@/components/layout';

type AdminContentShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

const AdminContentShell: React.FC<AdminContentShellProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-[#f6f7fb]">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:p-8">
          {title ? (
            <header className="mb-8 border-b border-slate-200/80 pb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  {subtitle}
                </p>
              ) : null}
            </header>
          ) : null}
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default AdminContentShell;
