import asyncio
import json
import os
import ssl
from datetime import datetime

from .database import SessionLocal
from .models import Event, Source

async def handle(reader, writer):
    data = await reader.readline()
    message = data.decode().strip()
    try:
        payload = json.loads(message)
    except json.JSONDecodeError:
        writer.close()
        return
    db = SessionLocal()
    source = db.query(Source).filter_by(name="syslog").first()
    if not source:
        source = Source(name="syslog", api_key="syslog", last_seen=datetime.utcnow())
        db.add(source)
        db.commit()
        db.refresh(source)
    ev = Event(source_id=source.id, **payload)
    db.add(ev)
    db.commit()
    db.close()
    writer.close()

async def run_syslog_server():
    sslctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    cert = os.getenv("SYSLOG_CERT")
    key = os.getenv("SYSLOG_KEY")
    if cert and key and os.path.exists(cert) and os.path.exists(key):
        sslctx.load_cert_chain(certfile=cert, keyfile=key)
    server = await asyncio.start_server(handle, host="0.0.0.0", port=6514, ssl=sslctx)
    async with server:
        await server.serve_forever()
