// convex/analytics.ts
import { query } from "./_generated/server";

export const getSubmissionStats = query(async ({ db }) => {
  // IMPORTANT: use submissions table, not forms
  const submissions = await db.query("submissions").collect();

  return {
    overview: {
      totalViews: 0, // optional if you track views later
      totalSubmissions: submissions.length,
      conversionRate: 0,
      avgCompletionTime: 0,
      viewsChange: 0,
      submissionsChange: 0,
      conversionChange: 0,
      timeChange: 0,
    },
    dailyData: [],
    deviceData: [],
    locationData: [],
    formPerformance: [],
    hourlyData: [],
  };
});


export const getAnalyticsData = query(async ({ db }) => {
  // Use the same logic for now as the other for compatibility
  const submissions = await db.query("forms").collect();
  return {
    overview: {
      totalViews: 0,
      totalSubmissions: 0,
      conversionRate: 0,
      avgCompletionTime: 0,
      viewsChange: 0,
      submissionsChange: 0,
      conversionChange: 0,
      timeChange: 0,
    },
    dailyData: [],
    deviceData: [],
    locationData: [],
    formPerformance: [],
    hourlyData: [],
  };
});