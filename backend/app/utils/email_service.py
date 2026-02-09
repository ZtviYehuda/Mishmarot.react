import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging


def send_email(to_email, subject, body_html):
    """
    Generic function to send generic emails via SMTP or simulate in console.
    """
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    if smtp_email and smtp_password:
        smtp_password = smtp_password.replace(
            " ", ""
        )  # Remove spaces from App Password
        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_email
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_html, "html"))

            print(f"   [SMTP] Connecting to Gmail as {smtp_email}...")
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())
            server.quit()
            print(f"✅ Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send real email: {e}")
            logging.error(f"Failed to send email: {e}")
            # Fallback to console simulation below

    # Development Fallback
    print("\n" + "█" * 60)
    print(f"📧 [EMAIL SIMULATION]")
    print(f"👉 To: {to_email}")
    print(f"📝 Subject: {subject}")
    print(f"📄 Body Preview: {body_html[:100]}...")
    print("█" * 60 + "\n")
    return True


def send_verification_email(to_email, code):
    """
    Sends a verification code email using the generic sender.
    """
    subject = "Mishmarot - קוד לאיפוס סיסמה"
    body = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin: 0;">איפוס סיסמה</h1>
            <p style="color: #64748b; font-size: 16px;">קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
            <div style="margin: 30px 0;">
                <span style="background-color: #f1f5f9; padding: 15px 30px; border-radius: 8px; font-size: 32px; font-family: monospace; letter-spacing: 5px; font-weight: bold; color: #0f172a;">
                    {code}
                </span>
            </div>
            <p style="color: #64748b; font-size: 14px;">הקוד תקף ל-10 דקות.</p>
            <p style="color: #cbd5e1; font-size: 12px; margin-top: 30px;">אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם ממייל זה.</p>
        </div>
    </div>
    """
    return send_email(to_email, subject, body)
