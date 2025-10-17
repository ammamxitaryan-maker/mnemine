/**
 * Виртуализированный список для больших наборов данных
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from './LoadingSpinner';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export const VirtualizedList = <T,>({
  items,
  height,
  itemHeight,
  renderItem,
  loading = false,
  emptyMessage = 'No items found',
  className = '',
  onScroll,
}: VirtualizedListProps<T>) => {
  const listRef = useRef<List>(null);

  // Обработчик скролла
  const handleScroll = (scrollTop: number) => {
    onScroll?.(scrollTop);
  };

  // Компонент элемента списка
  const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    
    return (
      <div style={style} className="px-2">
        {renderItem(item, index)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <LoadingSpinner size="lg" text="Loading items..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">{emptyMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        onScroll={({ scrollTop }) => handleScroll(scrollTop)}
        className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {ItemRenderer}
      </List>
    </div>
  );
};

/**
 * Виртуализированная таблица
 */
interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  rowHeight: number;
  columns: {
    key: string;
    label: string;
    width: number;
    render: (item: T, index: number) => React.ReactNode;
  }[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const VirtualizedTable = <T,>({
  items,
  height,
  rowHeight,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}: VirtualizedTableProps<T>) => {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // Компонент строки таблицы
  const RowRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    
    return (
      <div style={style} className="flex border-b border-gray-700 hover:bg-gray-800/50">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-3 py-2 flex items-center"
            style={{ width: column.width }}
          >
            {column.render(item, index)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <LoadingSpinner size="lg" text="Loading data..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">{emptyMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}>
      {/* Заголовок таблицы */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-3 py-3 text-sm font-medium text-gray-300"
            style={{ width: column.width }}
          >
            {column.label}
          </div>
        ))}
      </div>
      
      {/* Виртуализированный контент */}
      <List
        height={height - 48} // Вычитаем высоту заголовка
        itemCount={items.length}
        itemSize={rowHeight}
        width={totalWidth}
        className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {RowRenderer}
      </List>
    </div>
  );
};

/**
 * Хук для виртуализации с пагинацией
 */
export const useVirtualization = <T>(
  items: T[],
  options: {
    pageSize?: number;
    initialPage?: number;
    itemHeight?: number;
  } = {}
) => {
  const { pageSize = 50, initialPage = 0, itemHeight = 60 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scrollTop, setScrollTop] = useState(0);

  // Вычисляем видимые элементы
  const visibleItems = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  // Общее количество страниц
  const totalPages = Math.ceil(items.length / pageSize);

  // Переход к следующей странице
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      setScrollTop(0);
    }
  };

  // Переход к предыдущей странице
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setScrollTop(0);
    }
  };

  // Переход к конкретной странице
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      setScrollTop(0);
    }
  };

  // Обработчик скролла
  const handleScroll = (newScrollTop: number) => {
    setScrollTop(newScrollTop);
  };

  return {
    visibleItems,
    currentPage,
    totalPages,
    scrollTop,
    nextPage,
    prevPage,
    goToPage,
    handleScroll,
    hasNextPage: currentPage < totalPages - 1,
    hasPrevPage: currentPage > 0,
  };
};
