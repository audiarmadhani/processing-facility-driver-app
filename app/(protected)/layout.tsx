import DriverAppShell from '@/components/DriverAppShell';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DriverAppShell>{children}</DriverAppShell>;
}
