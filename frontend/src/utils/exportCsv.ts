export function exportCsv<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; title: string }[],
  filename: string
) {
  const header = columns.map(c => c.title).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      const val = row[c.key];
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return String(val ?? '');
    }).join(',')
  );
  
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
