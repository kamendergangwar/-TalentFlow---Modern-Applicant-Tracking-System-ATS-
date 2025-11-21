import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  candidateName: string;
  jobTitle: string;
  stage: string;
  type: "stage_change" | "interview_scheduled";
  interviewDetails?: {
    date: string;
    time: string;
    type: string;
    location?: string;
    meetingLink?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, candidateName, jobTitle, stage, type, interviewDetails }: NotificationRequest = await req.json();

    let subject = "";
    let html = "";

    if (type === "stage_change") {
      subject = `Application Update: ${jobTitle}`;
      html = `
        <h1>Hello ${candidateName},</h1>
        <p>Your application status for <strong>${jobTitle}</strong> has been updated.</p>
        <p>New Status: <strong>${stage}</strong></p>
        <p>Thank you for your interest in joining our team!</p>
        <p>Best regards,<br>The Recruitment Team</p>
      `;
    } else if (type === "interview_scheduled" && interviewDetails) {
      subject = `Interview Scheduled: ${jobTitle}`;
      html = `
        <h1>Hello ${candidateName},</h1>
        <p>Your interview for <strong>${jobTitle}</strong> has been scheduled!</p>
        <h2>Interview Details:</h2>
        <ul>
          <li><strong>Date:</strong> ${interviewDetails.date}</li>
          <li><strong>Time:</strong> ${interviewDetails.time}</li>
          <li><strong>Type:</strong> ${interviewDetails.type}</li>
          ${interviewDetails.location ? `<li><strong>Location:</strong> ${interviewDetails.location}</li>` : ""}
          ${interviewDetails.meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${interviewDetails.meetingLink}">${interviewDetails.meetingLink}</a></li>` : ""}
        </ul>
        <p>We look forward to speaking with you!</p>
        <p>Best regards,<br>The Recruitment Team</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "ATS Platform <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
