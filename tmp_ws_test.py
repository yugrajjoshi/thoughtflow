import asyncio
import websockets

async def main():
    uri = "ws://127.0.0.1:8000/ws/notifications/?token=5f1b2accefda848b3cb2619dbcb69f9cfad29402"
    try:
        async with websockets.connect(uri) as ws:
            print('Connected')
            while True:
                msg = await ws.recv()
                print('MSG:', msg)
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
