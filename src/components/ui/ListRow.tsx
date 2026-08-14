"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

type ListRowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
};

export const ListRow = forwardRef<HTMLDivElement, ListRowProps>(
  ({ interactive = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          flex min-h-12 items-center justify-between bg-panel px-4 py-3
          ${interactive ? "cursor-pointer active:bg-panel-2 transition-colors" : ""}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ListRow.displayName = "ListRow";
