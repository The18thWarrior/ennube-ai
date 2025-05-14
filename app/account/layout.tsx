export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen dark:bg-gray-900 p-8">
      {children}
    </div>
  );
}
