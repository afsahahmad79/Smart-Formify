import { action } from "../_generated/server";
import { v } from "convex/values";

const templates = {
  job: {
    title: "Job Application Form",
    description: "Please fill out this form to apply for the position.",
    elements: [
      {
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        type: "email",
        label: "Email Address",
        placeholder: "your.email@example.com",
        required: true,
      },
      {
        type: "textarea",
        label: "Cover Letter",
        placeholder: "Tell us why you're a great fit...",
        required: true,
        validation: { minLength: 50 },
      },
      {
        type: "select",
        label: "Experience Level",
        placeholder: "Select your experience",
        required: true,
        options: ["Entry Level", "Mid Level", "Senior"],
      },
    ],
  },
  survey: {
    title: "User Survey",
    description: "Help us improve by sharing your feedback.",
    elements: [
      {
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: false,
      },
      {
        type: "radio",
        label: "Satisfaction Level",
        required: true,
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      },
      {
        type: "textarea",
        label: "Comments",
        placeholder: "Share your thoughts...",
        required: false,
        validation: { maxLength: 500 },
      },
      {
        type: "checkbox",
        label: "Interests",
        options: ["Feature A", "Feature B", "Feature C"],
        required: false,
      },
    ],
  },
  contact: {
    title: "Contact Form",
    description: "Get in touch with us.",
    elements: [
      {
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        type: "email",
        label: "Email",
        placeholder: "your.email@example.com",
        required: true,
      },
      {
        type: "textarea",
        label: "Message",
        placeholder: "Your message here...",
        required: true,
        validation: { minLength: 10 },
      },
    ],
  },
};

export const generateForm = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const lowerPrompt = prompt.toLowerCase();
    let template;

    if (lowerPrompt.includes("job") || lowerPrompt.includes("application")) {
      template = templates.job;
    } else if (lowerPrompt.includes("survey") || lowerPrompt.includes("feedback")) {
      template = templates.survey;
    } else if (lowerPrompt.includes("contact") || lowerPrompt.includes("message")) {
      template = templates.contact;
    } else {
      // Default generic form
      template = {
        title: "General Form",
        description: "Please provide the required information.",
        elements: [
          {
            type: "text",
            label: "Name",
            placeholder: "Enter your name",
            required: true,
          },
          {
            type: "email",
            label: "Email",
            placeholder: "your.email@example.com",
            required: true,
          },
          {
            type: "textarea",
            label: "Description",
            placeholder: "Enter details...",
            required: false,
          },
        ],
      };
    }

    const formSchema = {
      id: `template-form-${Date.now()}`,
      title: template.title,
      description: template.description,
      status: "draft" as const,
      elements: template.elements.map((el, index) => ({
        ...el,
        id: `element-${index + 1}`,
      })),
    };

    // Basic validation
    if (!formSchema.title || formSchema.elements.length === 0) {
      throw new Error("Generated form is invalid: missing title or elements");
    }

    return formSchema;
  },
});

