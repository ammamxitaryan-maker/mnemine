"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ResponsiveDataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
}

const ResponsiveDataTable: React.FC<ResponsiveDataTableProps> = ({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onEdit,
  onDelete,
  onRefresh,
  title,
  subtitle,
  emptyMessage = "Данные не найдены",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showMobileView, setShowMobileView] = useState(false);

  // Фильтрация данных
  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    return filtered;
  }, [data, searchTerm, columns]);

  // Сортировка данных
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Пагинация
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, index) => index.toString())));
    }
  };

  const exportData = () => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...paginatedData.map(row =>
        columns.map(col => {
          const value = row[col.key];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderMobileCard = (row: any, index: number) => (
    <div
      key={index}
      className={`p-4 rounded-lg border transition-all duration-200 ${selectedRows.has(index.toString())
          ? 'bg-blue-900/20 border-blue-600'
          : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
        }`}
    >
      <div className="space-y-3">
        {columns.slice(0, 3).map(column => (
          <div key={column.key} className="flex justify-between items-center">
            <span className="text-sm text-gray-400">{column.label}:</span>
            <div className="text-sm text-white">
              {column.render ? column.render(row[column.key], row) : row[column.key]}
            </div>
          </div>
        ))}

        {(onEdit || onDelete) && (
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
            {onEdit && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                size="sm"
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row);
                }}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      {(title || subtitle) && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-600 text-white">
                {sortedData.length} записей
              </Badge>
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent>
        {/* Панель управления */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 w-full sm:w-64"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowMobileView(!showMobileView)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 sm:hidden"
              >
                {showMobileView ? 'Таблица' : 'Карточки'}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {exportable && (
              <Button
                onClick={exportData}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            )}
          </div>
        </div>

        {/* Содержимое таблицы */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">Загрузка данных...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Мобильный вид (карточки) */}
            {showMobileView ? (
              <div className="space-y-4">
                {paginatedData.map((row, index) => renderMobileCard(row, index))}
              </div>
            ) : (
              /* Десктопный вид (таблица) */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {onEdit || onDelete ? (
                        <th className="text-left p-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                      ) : null}
                      {columns.map(column => (
                        <th
                          key={column.key}
                          className={`text-left p-3 font-medium text-gray-300 ${column.sortable ? 'cursor-pointer hover:text-white' : ''
                            }`}
                          onClick={() => column.sortable && handleSort(column.key)}
                          style={{ width: column.width }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.label}</span>
                            {column.sortable && (
                              <div className="flex flex-col">
                                <ChevronUp
                                  className={`h-3 w-3 ${sortColumn === column.key && sortDirection === 'asc'
                                      ? 'text-blue-400'
                                      : 'text-gray-500'
                                    }`}
                                />
                                <ChevronDown
                                  className={`h-3 w-3 -mt-1 ${sortColumn === column.key && sortDirection === 'desc'
                                      ? 'text-blue-400'
                                      : 'text-gray-500'
                                    }`}
                                />
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                      {(onEdit || onDelete) && (
                        <th className="text-right p-3 font-medium text-gray-300">Действия</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${selectedRows.has(index.toString()) ? 'bg-blue-900/10' : ''
                          } ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onRowClick && onRowClick(row)}
                      >
                        {onEdit || onDelete ? (
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(index.toString())}
                              onChange={() => handleSelectRow(index.toString())}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        ) : null}
                        {columns.map(column => (
                          <td
                            key={column.key}
                            className={`p-3 text-gray-300 ${column.align === 'center' ? 'text-center' :
                                column.align === 'right' ? 'text-right' : 'text-left'
                              }`}
                          >
                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                          </td>
                        ))}
                        {(onEdit || onDelete) && (
                          <td className="p-3">
                            <div className="flex justify-end space-x-2">
                              {onEdit && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(row);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(row);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Пустое состояние */}
            {paginatedData.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg">{emptyMessage}</p>
                {searchTerm && (
                  <p className="text-sm mt-2">
                    Попробуйте изменить поисковый запрос
                  </p>
                )}
              </div>
            )}

            {/* Пагинация */}
            {pagination && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Показано {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} из {sortedData.length}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border-gray-600 text-gray-300 hover:bg-gray-700"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveDataTable;
