import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Optimizer EIS',
  description: 'Sistema de gestión de horarios para universidades y escuelas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
