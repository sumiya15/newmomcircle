import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, badge }) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] md:text-2xl font-bold text-white font-poppins leading-snug tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[13px] text-white/45 font-inter">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
