export default function GSuiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:pt-10 md:pb-12">
      {children}
    </section>
  )
}
