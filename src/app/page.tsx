import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/sections/hero";
import Stats from "@/components/sections/stats";
import DashboardPreview from "@/components/sections/dashboard-preview";
import GridTools from "@/components/sections/grid-tools";
import Ecosystem from "@/components/sections/ecosystem";
import Pricing from "@/components/sections/pricing";
import CTABanner from "@/components/sections/cta-banner";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <PageLayout headerVariant="default" className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-[20%] w-[50%] h-[50%] bg-purple-500/5 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10">
        <HeroSection />
        <Stats />
        <DashboardPreview />
        <GridTools />
        <Ecosystem />
        <Pricing />
        <CTABanner />
      </main>
      
      <Footer />
    </PageLayout>
  );
}