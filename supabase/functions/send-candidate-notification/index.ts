import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";


const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  candidateName: string;
  candidateEmail: string;
  oldStage?: string;
  newStage: string;
  jobTitle: string;
}

const getEmailTemplate = (candidateName: string, newStage: string, jobTitle: string) => {
  const stageMessages: Record<string, { subject: string; message: string; emoji: string }> = {
    applied: {
      subject: "Application Received",
      message: "We have received your application and our team will review it shortly.",
      emoji: "📝"
    },
    screening: {
      subject: "Application Under Review",
      message: "Your application is currently being reviewed by our recruitment team.",
      emoji: "🔍"
    },
    interview: {
      subject: "Interview Stage",
      message: "Congratulations! Your application has progressed to the interview stage. Our team will contact you soon to schedule an interview.",
      emoji: "📞"
    },
    offer: {
      subject: "Job Offer - Congratulations!",
      message: "We are delighted to extend an offer for this position. Our team will contact you with the details shortly.",
      emoji: "🎉"
    },
    hired: {
      subject: "Welcome to the Team!",
      message: "Welcome aboard! We're excited to have you join our team. You'll receive onboarding information soon.",
      emoji: "🎊"
    },
    rejected: {
      subject: "Application Update",
      message: "Thank you for your interest in this position. While we have decided to move forward with other candidates, we appreciate the time you invested in the application process.",
      emoji: "📄"
    }
  };

  const stageInfo = stageMessages[newStage] || stageMessages.applied;

  return {
    subject: `${stageInfo.subject} - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 24px;
              border-bottom: 2px solid #f0f0f0;
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 16px;
            }
            h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin: 0;
            }
            .content {
              margin: 24px 0;
            }
            .job-title {
              background-color: #f8f9fa;
              padding: 16px;
              border-radius: 6px;
              margin: 24px 0;
              border-left: 4px solid #4f46e5;
            }
            .job-title strong {
              color: #4f46e5;
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">${stageInfo.emoji}</div>
              <h1>${stageInfo.subject}</h1>
            </div>
            
            <div class="content">
              <p>Dear ${candidateName},</p>
              
              <p>${stageInfo.message}</p>
              
              <div class="job-title">
                <strong>Position:</strong> ${jobTitle}
              </div>
              
              ${newStage === 'rejected' 
                ? `<p>We encourage you to apply for future openings that match your qualifications. We wish you the best in your job search.</p>`
                : `<p>If you have any questions, please don't hesitate to reach out to us.</p>`
              }
            </div>
            
            <div class="footer">
              <p>This is an automated notification from our Applicant Tracking System.</p>
              <p>&copy; ${new Date().getFullYear()} ATS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received candidate notification request");
    
    const { candidateName, candidateEmail, oldStage, newStage, jobTitle }: EmailRequest = await req.json();

    console.log(`Sending email to ${candidateEmail} for stage change: ${oldStage || "initial"} -> ${newStage}`);

    // Validate input
    if (!candidateEmail || !candidateName || !newStage || !jobTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Try to fetch custom template from database
    let emailTemplate;
    const { data: customTemplate } = await supabaseClient
      .from("email_templates")
      .select("subject, body_html")
      .eq("stage", newStage)
      .eq("is_active", true)
      .maybeSingle();

    if (customTemplate) {
      console.log("Using custom template for stage:", newStage);
      // Replace placeholders in custom template
      const subject = customTemplate.subject
        .replace(/{{candidateName}}/g, candidateName)
        .replace(/{{jobTitle}}/g, jobTitle)
        .replace(/{{oldStage}}/g, oldStage || "")
        .replace(/{{newStage}}/g, newStage);
      
      const bodyHtml = customTemplate.body_html
        .replace(/{{candidateName}}/g, candidateName)
        .replace(/{{jobTitle}}/g, jobTitle)
        .replace(/{{oldStage}}/g, oldStage || "")
        .replace(/{{newStage}}/g, newStage);

      emailTemplate = { subject, html: bodyHtml };
    } else {
      console.log("Using default template for stage:", newStage);
      // Use default template
      emailTemplate = getEmailTemplate(candidateName, newStage, jobTitle);
    }

    const emailResponse = await resend.emails.send({
      from: "ATS Recruitment <onboarding@resend.dev>",
      to: [candidateEmail],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-candidate-notification function:", error);
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
