"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe, BarChart3, Code } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  const features = [
    {
      icon: Code,
      title: "Drag & Drop Builder",
      description: "Intuitive visual form builder with real-time preview and instant feedback.",
      color: "bg-blue-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive insights into form performance, user behavior, and response patterns.",
      color: "bg-green-500"
    },
    {
      icon: Globe,
      title: "Multi-Platform Support",
      description: "Works seamlessly across all devices and browsers with responsive design.",
      color: "bg-indigo-500"
    },
    
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">About Smart Formify</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            We're revolutionizing the way businesses collect and analyze data through intelligent, 
            user-friendly form building solutions. Our mission is to make data collection 
            accessible, efficient, and insightful for everyone.
          </p>
        </div>

        

        {/* What We Do */}
        <div className="mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">What We Do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-4 sm:p-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-base">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of businesses already using Smart Formify to transform their data collection.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                >
                  Start Building Forms
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => router.push('/contact')}
                  >
                  Contact Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
