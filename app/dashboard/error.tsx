'use client';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>Error en el módulo</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, maxWidth: 400 }}>
        {error.message || 'Ocurrió un error al cargar este módulo.'}
      </p>
      <button onClick={reset} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        Reintentar
      </button>
    </div>
  );
}