import { resend } from "../lib/resend.js";
import ResetPasswordEmail from "../emails/ResetPasswordEmail.js";

interface SendResetPasswordEmailProps {
  email: string;
  username: string;
  resetLink: string;
}

interface SendResetPasswordEmailResponse {
  success: boolean;
  message: string;
}

export async function sendResetPasswordEmail({
  email,
  username,
  resetLink,
}: SendResetPasswordEmailProps): Promise<SendResetPasswordEmailResponse> {
  try {
    await resend.emails.send({
      from: "BloodFlow <support@bloodflow.sayemtech.com>",
      to: email,
      subject: "BloodFlow: Reset your password",
      react: ResetPasswordEmail({ username, resetLink }),
    });
    return { success: true, message: "Reset email sent successfully" };
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return { success: false, message: "Failed to send reset password email" };
  }
}
