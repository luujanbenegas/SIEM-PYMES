from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.database import Base, engine, SessionLocal
from backend.app import auth, rules
from backend.app.models import Event, Source, User, Alert

Base.metadata.create_all(bind=engine)

def run():
    db: Session = SessionLocal()
    # Create initial user
    if not db.query(User).filter_by(username="admin").first():
        user = auth.create_user(db, "admin", "admin")
        print("Initial admin user created. TOTP secret:", user.totp_secret)
    # Create sample source
    source = db.query(Source).filter_by(name="seed").first()
    if not source:
        source = Source(name="seed", api_key="seedkey", last_seen=datetime.utcnow())
        db.add(source)
        db.commit()
    # Sample events
    now = datetime.utcnow()
    events = [
        Event(source_id=source.id, user="alice", type="file_access", timestamp=now - timedelta(hours=2), src_ip="10.0.0.1", details={"path": "/etc/passwd"}),
        Event(source_id=source.id, user="admin", type="login_success", timestamp=now, src_ip="8.8.8.8", details={"new_ip": True}),
        Event(source_id=source.id, user="charlie", type="login_failure", timestamp=now - timedelta(minutes=4), src_ip="1.1.1.1"),
        Event(source_id=source.id, user="charlie", type="login_failure", timestamp=now - timedelta(minutes=3), src_ip="1.1.1.1"),
        Event(source_id=source.id, user="charlie", type="login_failure", timestamp=now - timedelta(minutes=2), src_ip="1.1.1.1"),
    ]
    db.add_all(events)
    db.commit()
    # Run rules
    rules.run_rules(db, now - timedelta(days=1))
    alerts = db.query(Alert).all()
    print(f"Seeded {len(events)} events and generated {len(alerts)} alerts")
    db.close()

if __name__ == "__main__":
    run()
