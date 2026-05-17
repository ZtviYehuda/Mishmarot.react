import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()


def test_smtp():
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    print(f"Testing SMTP with: {smtp_email}")
    if not smtp_email or not smtp_password:
        print("Missing credentials")
        return

    to_email = "naftaly749@gmail.com"
    subject = "Test from Mishmarot Debug"
    body = "Checking if SMTP works."

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.set_debuglevel(1)
        server.starttls()
        server.login(smtp_email, smtp_password.replace(" ", ""))
        server.sendmail(smtp_email, to_email, msg.as_string())
        server.quit()
        print("✅ Success!")
    except Exception as e:
        print(f"❌ Failed: {e}")


if __name__ == "__main__":
    test_smtp()
