import type { ReactNode } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoaderScreen } from "@/components/layout/loader-screen";

interface DataBoundaryProps {
  loading: boolean;
  error: string;
  loadingMessage: string;
  children: ReactNode;
}

/** Shows the loader while data loads, the error if loading failed, else the page. */
export function DataBoundary({
  loading,
  error,
  loadingMessage,
  children,
}: DataBoundaryProps) {
  if (loading) return <LoaderScreen messages={[loadingMessage]} />;

  if (error) {
    return (
      <PageContainer>
        <p role="alert" className="form-alert">
          {error}
        </p>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
