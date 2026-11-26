import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from './StateViews';

type QueryBoundaryProps<T> = {
  query: UseQueryResult<T>;
  /** Return true when the loaded data should show the empty state. */
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; message?: string; actionLabel?: string; onAction?: () => void; icon?: import('lucide-react-native').LucideIcon; testID?: string };
  /** Custom empty layout; takes precedence over `empty`. */
  renderEmpty?: () => ReactNode;
  errorTitle?: string;
  children: (data: T) => ReactNode;
};

/**
 * One place that turns a TanStack Query result into loading / error / empty / content,
 * so every screen handles the same states the same way.
 */
export function QueryBoundary<T>({ query, isEmpty, empty, renderEmpty, errorTitle, children }: QueryBoundaryProps<T>) {
  if (query.isPending) return <LoadingState />;
  if (query.isError && query.data === undefined) {
    return <ErrorState error={query.error} title={errorTitle} onRetry={() => void query.refetch()} retrying={query.isRefetching} />;
  }
  const data = query.data as T;
  if (isEmpty?.(data) && renderEmpty) return <>{renderEmpty()}</>;
  if (isEmpty?.(data) && empty) return <EmptyState {...empty} testID={empty.testID ?? 'empty-state'} />;
  return <>{children(data)}</>;
}
