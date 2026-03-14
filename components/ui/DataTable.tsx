/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
};

type Props<T extends Record<string, any>> = {
  columns: Array<Column<T>>;
  rows: T[];
};

export function DataTable<T extends Record<string, any>>({ columns, rows }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/40">
                {columns.map((column) => (
                  <td key={`${row.id ?? index}-${String(column.key)}`} className="px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : (row as any)[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
