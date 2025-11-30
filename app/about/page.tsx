"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Target, Zap, Shield, Globe, BarChart3, Code, Lightbulb } from "lucide-react";
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
      icon: Zap,
      title: "Smart Integrations",
      description: "Seamless connections with popular tools like Zapier, Slack, and Google Sheets.",
      color: "bg-purple-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with data encryption, GDPR compliance, and secure hosting.",
      color: "bg-red-500"
    },
    {
      icon: Globe,
      title: "Multi-Platform Support",
      description: "Works seamlessly across all devices and browsers with responsive design.",
      color: "bg-indigo-500"
    },
    {
      icon: Lightbulb,
      title: "AI-Powered Insights",
      description: "Machine learning algorithms provide intelligent suggestions and optimization tips.",
      color: "bg-yellow-500"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10,000+", description: "Trusted by businesses worldwide" },
    { label: "Forms Created", value: "50,000+", description: "Millions of responses collected" },
    { label: "Uptime", value: "99.9%", description: "Reliable service you can count on" },
    { label: "Support", value: "24/7", description: "Always here when you need help" }
  ];

  const team = [
    {
      name: "Afsah Ahmad",
      role: "Founder & Lead Developer",
      bio: "Full-stack developer with expertise in modern web technologies and user experience design.",
      image: "/placeholder-user.jpg"
    },
    {
      name: "Development Team",
      role: "Software Engineers",
      bio: "Passionate developers focused on creating intuitive and powerful form building tools.",
      image: "/placeholder-user.jpg"
    }
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

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-blue-600" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm sm:text-base">
                To democratize data collection by providing powerful, yet simple tools that enable 
                businesses of all sizes to gather insights, understand their audience, and make 
                data-driven decisions without the complexity of traditional enterprise solutions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                <span>Our Vision</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm sm:text-base">
                To become the world's leading platform for intelligent form building, where 
                anyone can create sophisticated data collection tools that adapt and learn 
                from user behavior, providing unprecedented insights and automation.
              </p>
            </CardContent>
          </Card>
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

        {/* Team */}
        <div className="mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {team.map((member, index) => (
              <Card key={index}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold">{member.name}</h3>
                      <p className="text-primary font-medium text-sm sm:text-base">{member.role}</p>
                      <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-base">{member.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Why Choose Smart Formify?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span>User-Centric Design</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Every feature is designed with the user in mind. We believe that powerful tools 
                  should be easy to use, regardless of technical expertise. Our intuitive interface 
                  makes form building accessible to everyone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-yellow-600" />
                  <span>Innovation First</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We're constantly pushing the boundaries of what's possible in form building. 
                  From AI-powered insights to real-time collaboration, we're always exploring 
                  new ways to make your forms smarter and more effective.
                </p>
              </CardContent>
            </Card>
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
