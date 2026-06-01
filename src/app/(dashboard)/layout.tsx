import Sidebar from '@/components/ui/Sidebar'
import BottomNav from '@/components/ui/BottomNav'
import ConfirmProvider from '@/components/ui/ConfirmProvider'
import InstallBanner from '@/components/ui/InstallBanner'
import ThemeProvider from '@/components/ui/ThemeProvider'
import DebtAlerts from '@/components/ui/DebtAlerts'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
          <Sidebar />
          <main
            className="md:ml-60 pb-20 md:pb-0 min-h-screen"
            style={{ backgroundColor: 'var(--background)' }}
          >
            <DebtAlerts />
            {children}
          </main>
          <BottomNav />
          <InstallBanner />
        </div>
      </ConfirmProvider>
    </ThemeProvider>
  )
}
