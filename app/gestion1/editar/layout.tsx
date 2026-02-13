import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editar", // Esto llenará el hueco y dirá "Ingreso - gestion1"
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}