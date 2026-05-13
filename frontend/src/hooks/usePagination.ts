import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export function usePagination(defaultPageSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination(prev => ({ ...prev, total }));
  }, []);

  const antdPagination = {
    current: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (page: number, pageSize: number) => {
      setPagination({ page, pageSize, total: pagination.total });
    },
  };

  return { pagination, setPage, setPageSize, setTotal, antdPagination };
}
