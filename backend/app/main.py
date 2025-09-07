from datetime import datetime, timedelta
from typing import List

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import auth, rules
from .syslog_server import run_syslog_server
from .database import Base, engine, get_db
from .models import Event, Alert, Source

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini SIEM")

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None, db: Session = Depends(get_db)):
    otp = form_data.scopes[0] if form_data.scopes else "000000"
    src_ip = request.client.host if request else "unknown"
    user, new_ip = auth.authenticate_user(db, form_data.username, form_data.password, otp, src_ip)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = auth.create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    event = Event(user=user.username, type="login_success", src_ip=src_ip, details={"new_ip": new_ip})
    db.add(event)
    db.commit()
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/sources")
async def register_source(name: str, db: Session = Depends(get_db)):
    import secrets
    key = secrets.token_hex(16)
    source = Source(name=name, api_key=key, last_seen=datetime.utcnow())
    db.add(source)
    db.commit()
    return {"api_key": key}

@app.post("/events")
async def ingest_event(event: dict, request: Request, db: Session = Depends(get_db)):
    key = request.headers.get("X-API-Key")
    source = db.query(Source).filter(Source.api_key == key).first()
    if not source:
        raise HTTPException(status_code=401, detail="Invalid source")
    source.last_seen = datetime.utcnow()
    ev = Event(**event, source_id=source.id)
    db.add(ev)
    db.commit()
    return {"status": "ok"}

@app.get("/events")
async def list_events(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.timestamp.desc()).offset(skip).limit(limit).all()

@app.get("/alerts")
async def list_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()

@app.patch("/alerts/{alert_id}")
async def update_alert(alert_id: int, status: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Not found")
    alert.status = status
    db.commit()
    return {"status": "updated"}

@app.get("/metrics")
async def metrics(db: Session = Depends(get_db)):
    # detection time average
    avg_detection = db.query(Alert.detection_time).all()
    avg = sum(a[0] for a in avg_detection) / len(avg_detection) if avg_detection else 0
    active_sources = db.query(Source).count()
    return {"avg_detection_time": avg, "active_sources": active_sources}

last_run = datetime.utcnow()

@app.on_event("startup")
async def startup_event():
    import asyncio
    async def scheduler():
        global last_run
        while True:
            db = next(get_db())
            rules.run_rules(db, last_run)
            last_run = datetime.utcnow()
            await asyncio.sleep(60)
    asyncio.create_task(scheduler())
    asyncio.create_task(run_syslog_server())
