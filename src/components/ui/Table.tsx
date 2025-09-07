import React from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export const Table: React.FC<TableProps> = ({ children, className }) => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
    <table className={clsx('table', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => (
  <thead className={clsx('table-header', className)}>
    {children}
  </thead>
);

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => (
  <tbody className={clsx('bg-white divide-y divide-neutral-200', className)}>
    {children}
  </tbody>
);

export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => (
  <tr
    className={clsx(
      'table-row',
      onClick && 'cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
);

export const TableCell: React.FC<TableCellProps> = ({ children, className, header = false }) => {
  if (header) {
    return (
      <th className={clsx('table-header-cell', className)}>
        {children}
      </th>
    );
  }
  
  return (
    <td className={clsx('table-cell', className)}>
      {children}
    </td>
  );
};