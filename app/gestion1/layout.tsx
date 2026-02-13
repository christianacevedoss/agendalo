import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s - gestion1', // El "%s" se reemplaza por el título de la página interna
    default: 'Panel - gestion1', // Este sale si la página interna no tiene título
  },
};

export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* Aquí podrías poner también tu Sidebar o Navbar de admin si no lo tienes */}
      {children}
    </section>
  );
}