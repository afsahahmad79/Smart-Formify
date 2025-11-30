"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigate to signup or dashboard
    router.push('/dashboard');
  };

  const handleLearnMore = () => {
    // Navigate to about page
    router.push('/about');
  };

  const handleContactUs = () => {
    // Navigate to contact page
    router.push('/contact');
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-6">
      {/* Hero Section */}
      <section className="text-center w-full max-w-3xl py-12 sm:py-20">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          Smart Formify
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground">
          Build dynamic forms with real-time preview and advanced analytics.
          Streamline your data collection with AI-powered insights.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="rounded-2xl shadow-md w-full sm:w-auto"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="rounded-2xl w-full sm:w-auto"
            onClick={handleLearnMore}
          >
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-8 sm:mt-12">
        <Card className="rounded-2xl shadow-sm border">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Drag & Drop Builder</h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Create forms easily with our intuitive drag-and-drop interface.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Real-Time Preview</h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Instantly preview your forms as you build them.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Advanced Analytics</h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Gain insights with powerful analytics dashboards.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Contact Section */}
      <section className="max-w-2xl w-full mt-16 sm:mt-20 text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Get in Touch</h2>
        <p className="mt-2 text-gray-600">Have questions? We'd love to hear from you.</p>
        <div className="mt-6 flex justify-center">
          <Button 
            variant="default" 
            size="lg"
            onClick={handleContactUs}
            className="w-full sm:w-auto"
          >
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
}
