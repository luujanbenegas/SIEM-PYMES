from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import Event, Alert, User

WORK_START = 8
WORK_END = 17


def rule_file_out_of_hours(db: Session, since: datetime):
    events = db.query(Event).filter(
        Event.type == "file_access",
        Event.timestamp > since
    ).all()
    alerts = []
    for ev in events:
        if ev.timestamp.hour < WORK_START or ev.timestamp.hour >= WORK_END:
            msg = f"File access outside work hours by {ev.user}"
            detection_time = (datetime.utcnow() - ev.timestamp).total_seconds()
            alert = Alert(event_id=ev.id, rule_name="out_of_hours", message=msg, detection_time=detection_time)
            db.add(alert)
            alerts.append(alert)
    return alerts


def rule_login_new_ip(db: Session, since: datetime):
    events = db.query(Event).filter(
        Event.type == "login_success",
        Event.timestamp > since
    ).all()
    alerts = []
    for ev in events:
        if ev.details and ev.details.get("new_ip"):
            msg = f"New login IP for user {ev.user}: {ev.src_ip}"
            detection_time = (datetime.utcnow() - ev.timestamp).total_seconds()
            alert = Alert(event_id=ev.id, rule_name="new_ip", message=msg, detection_time=detection_time)
            db.add(alert)
            alerts.append(alert)
    return alerts


def rule_failed_logins(db: Session, since: datetime):
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    events = db.query(Event).filter(
        Event.type == "login_failure",
        Event.timestamp > cutoff
    ).all()
    counts = {}
    for ev in events:
        counts.setdefault(ev.user, 0)
        counts[ev.user] += 1
    alerts = []
    for user, count in counts.items():
        if count >= 3:
            latest = max(e.timestamp for e in events if e.user == user)
            detection_time = (datetime.utcnow() - latest).total_seconds()
            alert = Alert(event_id=None, rule_name="failed_login", message=f"Multiple failed logins for {user}", detection_time=detection_time)
            db.add(alert)
            alerts.append(alert)
    return alerts


def run_rules(db: Session, since: datetime):
    rule_file_out_of_hours(db, since)
    rule_login_new_ip(db, since)
    rule_failed_logins(db, since)
    db.commit()
