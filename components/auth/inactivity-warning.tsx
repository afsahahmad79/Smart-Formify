"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InactivityWarningProps {
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function InactivityWarning({ timeLeft, onExtend, onLogout }: InactivityWarningProps) {
  const [countdown, setCountdown] = useState(timeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Session Timeout Warning</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You've been inactive for too long. You'll be logged out in:
          </p>
          <div className="text-3xl font-bold text-red-600">
            {formatTime(countdown)}
          </div>
          <p className="text-sm text-gray-500">
            Click "Stay Logged In" to continue your session
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onExtend} variant="default">
              Stay Logged In
            </Button>
            <Button onClick={onLogout} variant="outline">
              Logout Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
