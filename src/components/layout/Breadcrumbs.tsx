import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { label: string; href?: string; active?: boolean }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <span className="inline-flex items-center text-xs font-medium text-slate-500 ">
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Telangana Today
          </span>
        </li>
        {items.map((item, idx) => (
          <li key={idx}>
            <div className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1" />
              {item.active ? (
                <span className="text-xs font-semibold text-indigo-600 ">
                  {item.label}
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-500 hover:text-slate-700  ">
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
