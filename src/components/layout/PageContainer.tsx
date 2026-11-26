import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Shared page width, horizontal padding and vertical rhythm. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[var(--size-content-max)] px-4 pt-16 pb-6 md:px-8 md:pt-8 md:pb-8 lg:px-12 lg:pt-12 lg:pb-12 ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
