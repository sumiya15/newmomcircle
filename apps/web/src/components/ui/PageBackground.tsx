import React from 'react';

interface PageBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  children: React.ReactNode;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  imageUrl,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`page-root ${className}`}
      style={{ backgroundImage: `url('${imageUrl}')` }}
      {...props}
    >
      <div className="page-content flex flex-col min-h-screen w-full">
        {children}
      </div>
    </div>
  );
};

export default PageBackground;
