import { prisma } from '@/lib/prisma'

async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: 'desc', 
      },
    })
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export default async function HomePage() {
  const users = await getUsers()

  return (
    <div className="container">
      <h1>Organizador de Horarios</h1>
      <p>Sistema de gestión para universidades y escuelas</p>

      {/* Sección de Usuarios */}
      <section className="section">
        <h2>Usuarios Registrados ({users.length})</h2>
        
        {users.length === 0 ? (
          <div className="empty-state">
            <p>No hay usuarios registrados aún.</p>
            <p>Puedes agregar usuarios manualmente desde Prisma Studio o PostgreSQL.</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="user-info">
                  <h3>{user.name || 'Usuario sin nombre'}</h3>
                  <p className="user-email">{user.email}</p>
                  <p className="user-id">ID: {user.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}