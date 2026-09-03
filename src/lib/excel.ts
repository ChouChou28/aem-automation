import * as XLSX from "xlsx";

/**
 * Export an array of plain row objects to a downloaded `.xlsx` file.
 * Columns are inferred from the union of all row keys (order preserved).
 */
export function exportToExcel(
  rows: Record<string, unknown>[],
  fileName = "automation-result",
  sheetName = "Result"
): void {
  const safeRows = rows.length ? rows : [{ message: "No results" }];
  const worksheet = XLSX.utils.json_to_sheet(safeRows);

  // Auto-size columns from content length.
  const keys = Object.keys(safeRows[0]);
  worksheet["!cols"] = keys.map((key) => {
    const max = safeRows.reduce(
      (acc, r) => Math.max(acc, String(r[key] ?? "").length),
      key.length
    );
    return { wch: Math.min(Math.max(max + 2, 10), 60) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  XLSX.writeFile(workbook, `${fileName}-${stamp}.xlsx`);
}
