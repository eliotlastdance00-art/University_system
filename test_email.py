import asyncio
from app.auth.email.service import send_otp_email

async def main():
    try:
        await send_otp_email("test@example.com", "123456")
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
