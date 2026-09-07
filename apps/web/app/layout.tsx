import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AIAssistantDrawer from '@/components/AIAssistantDrawer';
import ApiStatusBanner from '@/components/ApiStatusBanner';

export const metadata: Metadata = {
  title: 'Land Record Intelligence | Botanical Cadastral System',
  description: 'Intelligent Land Record Digitization, Multilingual OCR, PostGIS Cadastral Verification & Fraud Risk Intelligence Platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F9F8F4] text-[#2D3A31] min-h-screen flex flex-col font-sans selection:bg-[#8C9A84]/20 selection:text-[#2D3A31]">
        {/* MANDATORY Paper Grain Texture Overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.018]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        <div className="flex h-screen overflow-hidden relative">
          {/* Botanical Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F9F8F4]">
            <ApiStatusBanner />
            <Navbar />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
              {children}
            </main>
          </div>

          {/* Floating Botanical AI Assistant Drawer */}
          <AIAssistantDrawer />
        </div>
      </body>
    </html>
  );
}
