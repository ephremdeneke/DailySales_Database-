import React from "react";

export default function DataTable({ columns, data, emptyText = "No data available" }) {
  return (
    <div className="table-wrap w-full">
      <table className="data min-w-[600px] sm:min-w-full">
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) && (
            <tr><td colSpan={columns.length} className="text-center text-slate-400 py-6">{emptyText}</td></tr>
          )}
          {data && data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
