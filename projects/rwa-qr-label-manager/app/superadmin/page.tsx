'use client'

import Link from 'next/link'

export default function SuperadminPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold gradient-text">Trust Layer — Control Center</h1>
          <p className="text-sm text-[var(--c4)]">
            Gestiona activos tokenizados, controla inventario y genera etiquetas QR compatibles con ERC-3643.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-4">
          <Link href="/superadmin/qr-generator" className="card-hover block">
            <h2 className="text-xl font-semibold mb-2">RWA QR Label Forge</h2>
            <p className="text-sm text-[var(--c4)]">
              Configura roles, series, tamaños y anclajes multi-chain. Emite códigos listos para producción en menos de
              dos minutos.
            </p>
          </Link>

          <div className="card block">
            <h2 className="text-xl font-semibold mb-2">Inventario &amp; Trazabilidad</h2>
            <p className="text-sm text-[var(--c4)]">
              El módulo MES/ERP estará disponible aquí. Cada evento se registrará bajo ISO/TC 307 con soporte ERC-3643.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}


