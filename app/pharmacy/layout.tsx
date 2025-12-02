// app/pharmacy/layout.tsx
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PharmacyShell>{children}</PharmacyShell>;
}
