from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY

from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    totp_secret = Column(String)
    role = Column(String, default="analyst")
    known_ips = Column(ARRAY(String), default=[])

class Source(Base):
    __tablename__ = "sources"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    api_key = Column(String, unique=True, index=True)
    last_seen = Column(DateTime)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("sources.id"))
    user = Column(String, index=True)
    type = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    src_ip = Column(String)
    details = Column(JSON)
    source = relationship("Source")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    rule_name = Column(String)
    status = Column(String, default="new")
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    detection_time = Column(Float)  # seconds
    event = relationship("Event")
