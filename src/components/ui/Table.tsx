import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {}
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {}
interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '', ...props }) => (
  <thead className={`[&_tr]:border-b ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '', ...props }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableFooter: React.FC<TableFooterProps> = ({ children, className = '', ...props }) => (
  <tfoot className={`bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className}`} {...props}>
    {children}
  </tfoot>
);

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', ...props }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '', ...props }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', ...props }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
    {children}
  </td>
);

export const TableCaption: React.FC<TableCaptionProps> = ({ children, className = '', ...props }) => (
  <caption className={`mt-4 text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </caption>
); 