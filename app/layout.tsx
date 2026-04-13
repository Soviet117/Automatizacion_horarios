import './globals.css'

export const metadata = {
  title: 'Organizador de Horarios',
  description: 'Sistema de gestión de horarios para universidades y escuelas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
