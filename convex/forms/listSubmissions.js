import { query } from "../_generated/server";
import { v } from "convex/values";

export const listSubmissions = query({
  handler: async (ctx) => {
    // Optionally filter by user or form
    const submissions = await ctx.db.query("submissions").collect();
    // Optionally enrich with form name
    const forms = await ctx.db.query("forms").collect();
    return submissions.map((s) => {
      const form = forms.find((f) => String(f._id) === String(s.formId));
      return {
        id: String(s._id),
        formId: String(s.formId),
        formName: form ? form.title : "Unknown Form",
        submittedAt: s.submittedAt,
        submitterEmail: s.submitterEmail || "Anonymous",
        submitterName: s.submitterName || "Anonymous",
        status: "new",
        data: s.data,
      };
    });
  },
});
