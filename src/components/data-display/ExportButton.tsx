import { useCallback, useState } from 'react'
import { Download, FileText, Table } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils/cn'

/**
 * ExportButton — exporta un dataset a CSV (JS plano) o dispara PDF via print.
 *
 * Design v3 referencia: "Exportar CSV" (05-pulso), "Exportar PDF" (10-briefing,
 * con icono de descarga). Sin dependencias extra:
 *   - CSV: se arma un Blob en el cliente y se descarga (cero libs).
 *   - PDF: window.print() acotado. Si pasas printTargetId, se imprime SOLO ese
 *     nodo (clase utilitaria .print-scope que Wave 1 puede estilar en print),
 *     si no, imprime la pagina. No requiere react-to-print.
 *
 * Reusable y honesto: en CSV vacio el boton queda disabled (no genera archivo
 * con headers sin filas a menos que se fuerce). Regla 79: cero acentos.
 */

export type ExportFormat = 'csv' | 'pdf'

export type CsvColumn<Row> = {
  /** Encabezado de columna (sin acentos). */
  header: string
  /** Extrae el valor de la celda desde la fila. */
  accessor: (row: Row) => string | number | boolean | null | undefined
}

export type ExportButtonProps<Row> = {
  /** Formatos a ofrecer. Default: ambos. */
  formats?: ExportFormat[]
  /** Nombre base del archivo (sin extension). Default: "polaris-export". */
  filename?: string

  // --- CSV ---
  /** Filas a exportar a CSV. */
  rows?: Row[]
  /** Columnas (header + accessor). Requerido para CSV. */
  columns?: CsvColumn<Row>[]

  // --- PDF ---
  /** id del nodo a imprimir. Si se omite, imprime la pagina completa. */
  printTargetId?: string
  /** Override total del PDF: si lo pasas, se llama en vez de window.print. */
  onExportPdf?: () => void

  /** Variante del Button (default ghost, como en los mockups). */
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Deshabilita todo (ej: cargando o sin datos). */
  disabled?: boolean
}

/** Escapa un campo CSV (comillas, comas, saltos de linea) segun RFC 4180. */
function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const head = columns.map((c) => escapeCsv(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(c.accessor(row))).join(','))
    .join('\r\n')
  return body ? `${head}\r\n${body}` : head
}

function downloadCsv(filename: string, csv: string): void {
  // BOM (escape \uFEFF) para que Excel respete UTF-8 al abrir el CSV.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Liberar en el siguiente tick (algunos navegadores cancelan si se revoca ya).
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * Imprime un nodo acotado por id sin libs: marca <html> con data-print-scope
 * para que CSS @media print oculte el resto. Wave 1 define el CSS print;
 * fallback: si no hay id, imprime la pagina entera.
 */
function printScoped(printTargetId?: string): void {
  if (!printTargetId) {
    window.print()
    return
  }
  const root = document.documentElement
  const prev = root.getAttribute('data-print-scope')
  root.setAttribute('data-print-scope', printTargetId)
  const cleanup = () => {
    if (prev === null) root.removeAttribute('data-print-scope')
    else root.setAttribute('data-print-scope', prev)
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
  // Fallback por si afterprint no dispara (algunos navegadores).
  setTimeout(cleanup, 1000)
}

export function ExportButton<Row>({
  formats = ['csv', 'pdf'],
  filename = 'polaris-export',
  rows,
  columns,
  printTargetId,
  onExportPdf,
  variant = 'ghost',
  size = 'sm',
  className,
  disabled = false,
}: ExportButtonProps<Row>) {
  const [busy, setBusy] = useState<ExportFormat | null>(null)

  const csvReady = Boolean(rows && columns && columns.length > 0)
  const csvEmpty = csvReady && (rows?.length ?? 0) === 0

  const handleCsv = useCallback(() => {
    if (!rows || !columns) return
    setBusy('csv')
    try {
      downloadCsv(filename, buildCsv(rows, columns))
    } finally {
      setBusy(null)
    }
  }, [rows, columns, filename])

  const handlePdf = useCallback(() => {
    setBusy('pdf')
    try {
      if (onExportPdf) onExportPdf()
      else printScoped(printTargetId)
    } finally {
      setBusy(null)
    }
  }, [onExportPdf, printTargetId])

  const showCsv = formats.includes('csv')
  const showPdf = formats.includes('pdf')

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showCsv ? (
        <Button
          variant={variant}
          size={size}
          loading={busy === 'csv'}
          disabled={disabled || !csvReady || csvEmpty}
          onClick={handleCsv}
          title={csvEmpty ? 'No hay datos para exportar' : 'Exportar a CSV'}
          aria-label="Exportar a CSV"
        >
          <Table size={size === 'sm' ? 14 : 16} aria-hidden="true" />
          <span>CSV</span>
        </Button>
      ) : null}

      {showPdf ? (
        <Button
          variant={variant}
          size={size}
          loading={busy === 'pdf'}
          disabled={disabled}
          onClick={handlePdf}
          title="Exportar a PDF"
          aria-label="Exportar a PDF"
        >
          {printTargetId || onExportPdf ? (
            <FileText size={size === 'sm' ? 14 : 16} aria-hidden="true" />
          ) : (
            <Download size={size === 'sm' ? 14 : 16} aria-hidden="true" />
          )}
          <span>PDF</span>
        </Button>
      ) : null}
    </div>
  )
}

export default ExportButton
