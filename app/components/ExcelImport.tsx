'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/app/context/ToastContext';

interface ExcelImportProps {
  userId: string;
  onImportSuccess?: () => void;
}

export default function ExcelImport({ userId, onImportSuccess }: ExcelImportProps) {
  const { toast } = useToast();
  const [rawData, setRawData] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);

  const requiredColumns = ['curso', 'dia', 'aula', 'inicio', 'fin', 'docente'];

  const normalizeKey = (key: string) =>
    String(key ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const isTimeColumn = (columnName: string) => {
    const normalized = normalizeKey(columnName);
    return normalized.includes('hora') || normalized.includes('inicio') || normalized.includes('fin');
  };

  const formatTime = (time: any) => {
    if (time == null) return '';
    if (typeof time === 'number') {
      const totalMinutes = Math.round(time * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    if (typeof time === 'string') {
      const normalized = time.trim();
      if (/^\d{1,2}:\d{2}$/.test(normalized)) return normalized;
      const numeric = Number(normalized);
      if (!Number.isNaN(numeric)) {
        const totalMinutes = Math.round(numeric * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
      return normalized;
    }
    return String(time);
  };

  const getPreviewValue = (col: string, value: any) => {
    if (value == null) return '';
    return isTimeColumn(col) ? formatTime(value) : String(value);
  };

  const manejarImportacion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (!arrayBuffer) throw new Error('No se pudo leer el archivo');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const datosRaw: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (datosRaw.length === 0) {
          setErrorMessage('El archivo Excel está vacío.');
          setShowPreview(false);
          return;
        }

        const columns = Array.from(
          new Set(datosRaw.flatMap((row: any) => Object.keys(row)))
        ) as string[];
        
        const normalizedColumns = columns.map(normalizeKey);
        const missing = requiredColumns.filter(
          (required) =>
            !normalizedColumns.some((col) => col.includes(required))
        );

        setRawData(datosRaw);
        setPreviewRows(datosRaw);
        setPreviewColumns(columns);
        setMissingColumns(missing);
        setShowPreview(true);

        if (missing.length > 0) {
          setErrorMessage(
            `Faltan columnas obligatorias: ${missing.join(', ')}. Asegúrate de que existan equivalencias para curso, dia, aula, inicio, fin, docente.`
          );
        } else {
          setErrorMessage(null);
        }
      } catch (err) {
        setErrorMessage('Error al leer el archivo. Asegúrate de cargar un Excel válido.');
        setShowPreview(false);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importarDatos = async () => {
    if (!rawData.length) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawData.map(row => ({ ...row, userId }))),
      });

      if (res.ok) {
        toast('¡Horarios importados con éxito!', 'success');
        setShowPreview(false);
        setRawData([]);
        setPreviewRows([]);
        setPreviewColumns([]);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        const err = await res.json();
        setErrorMessage('Error al importar: ' + (err.error || 'Respuesta inválida del servidor'));
      }
    } catch (err) {
      setErrorMessage('Error de red al importar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
      <h2>Importación Masiva</h2>
      <p className="section-subtitle">Sube un archivo Excel para registrar todos los horarios a la vez</p>

      <div className="form-card" style={{ marginBottom: '2rem' }}>
        <div className="form-header">
          <span className="form-icon">📁</span>
          <h3>Cargar Archivo Excel</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            El archivo debe contener las columnas necesarias para el esquema de horarios:{' '}
            <code>curso</code>, <code>dia</code>, <code>aula</code>, <code>inicio</code>, <code>fin</code> y <code>docente</code>.
          </p>

          <div>
            <label
              className="btn-submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: 'auto',
                padding: '0.9rem 2rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Procesando...' : '📁 Seleccionar Excel'}
              <input
                type="file"
                onChange={manejarImportacion}
                hidden
                accept=".xlsx,.xls"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {errorMessage && (
          <div className="form-message form-message-error" style={{ marginTop: '1.5rem' }}>
            ❌ {errorMessage}
          </div>
        )}
      </div>

      {showPreview && (
        <div 
          className="form-card" 
          style={{ 
            padding: '1.5rem', 
            background: 'rgba(30, 41, 59, 0.4)', 
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingBottom: '1rem', 
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)', 
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              Vista previa: <strong>{previewRows.length}</strong> registros encontrados
            </div>
            <div style={{ color: missingColumns.length ? '#fca5a5' : '#86efac', fontWeight: 600, fontSize: '0.9rem' }}>
              {missingColumns.length > 0 
                ? `Faltan columnas obligatorias` 
                : 'Estructura válida para importación'}
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <tr>
                  {previewColumns.map((col) => (
                    <th 
                      key={col} 
                      style={{ 
                        padding: '12px 16px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: '#94a3b8', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr 
                    key={i} 
                    style={{ 
                      borderBottom: '1px solid rgba(148, 163, 184, 0.05)', 
                      backgroundColor: i % 2 === 0 ? 'rgba(30, 41, 59, 0.15)' : 'transparent' 
                    }}
                  >
                    {previewColumns.map((col) => (
                      <td key={col} style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                        {getPreviewValue(col, row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={importarDatos}
              disabled={loading || missingColumns.length > 0}
              className="btn-submit"
              style={{ width: 'auto', padding: '0.8rem 1.5rem' }}
            >
              {loading ? '⏳ Importando...' : '📥 Importar a la Base de Datos'}
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                setRawData([]);
                setPreviewRows([]);
                setPreviewColumns([]);
                setErrorMessage(null);
              }}
              disabled={loading}
              className="btn-submit"
              style={{ 
                width: 'auto', 
                padding: '0.8rem 1.5rem', 
                background: 'rgba(148, 163, 184, 0.1)', 
                color: '#cbd5e1',
                boxShadow: 'none'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
