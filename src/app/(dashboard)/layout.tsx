import Sidebar from '@/components/ui/Sidebar'
import BottomNav from '@/components/ui/BottomNav'
import ConfirmProvider from '@/components/ui/ConfirmProvider'
import InstallBanner from '@/components/ui/InstallBanner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConfirmProvider>
      <div className="min-h-screen" style={{ backgroundColor: '#0f1117' }}>
        <Sidebar />
        <main
          className="md:ml-60 pb-20 md:pb-0 min-h-screen"
          style={{ backgroundColor: '#0f1117' }}
        >
          {children}
        </main>
        <BottomNav />
        <InstallBanner />
      </div>
    </ConfirmProvider>
  )
}
