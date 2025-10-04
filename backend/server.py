from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
import uuid
import hashlib
import secrets
# import smtplib
# from email.mime.text import MimeText
from pathlib import Path
import asyncio
from collections import defaultdict, Counter
import json
import socket
import threading
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from fastapi.responses import StreamingResponse
import pytz

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuración de zona horaria
ASUNCION_TZ = pytz.timezone('America/Asuncion')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'siem_database')]

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# FastAPI app setup
app = FastAPI(title="Sistema SIEM para PYMEs", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nombre_completo: str
    rol: str = "usuario"  # admin, analista, usuario
    activo: bool = True
    requires_2fa: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(ASUNCION_TZ))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nombre_completo: str
    rol: str = "usuario"

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    codigo_2fa: Optional[str] = None

class SecurityEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(ASUNCION_TZ))
    source_ip: str
    source_name: Optional[str] = None
    event_type: str  # login_failed, access_granted, access_denied, system_change
    severity: str = "info"  # critical, high, medium, low, info
    user_agent: Optional[str] = None
    username: Optional[str] = None
    description: str
    raw_data: Optional[Dict[str, Any]] = None
    processed: bool = False

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    rule_name: str
    severity: str
    status: str = "open"  # open, investigating, resolved, false_positive
    created_at: datetime = Field(default_factory=lambda: datetime.now(ASUNCION_TZ))
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    notes: Optional[str] = None

class SecurityRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    conditions: Dict[str, Any]
    actions: List[str]
    enabled: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ASUNCION_TZ))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class EmailVerificationCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    code: str
    expires_at: datetime
    used: bool = False

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

def generate_2fa_code():
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

async def send_2fa_email(email: str, code: str):
    # Simulación de envío de email - en producción usar un servicio real
    logger.info(f"Enviando código 2FA {code} a {email}")
    # Aquí integrarías con SendGrid, AWS SES, etc.
    return True

# Reglas de seguridad automáticas
async def process_security_event(event: SecurityEvent):
    """Procesa eventos y genera alertas según las reglas"""
    alerts_generated = []
    
    # Regla 1: Acceso fuera de horario laboral (8am-17pm)
    event_time = event.timestamp.astimezone(ASUNCION_TZ)
    hour = event_time.hour
    
    if (hour < 8 or hour >= 17) and event.event_type in ["access_granted", "login_success"]:
        alert = Alert(
            event_id=event.id,
            rule_name="Acceso Fuera de Horario",
            severity="medium",
            status="open"
        )
        await db.alerts.insert_one(alert.dict())
        alerts_generated.append(alert)
    
    # Regla 2: Múltiples intentos de login fallidos
    if event.event_type == "login_failed":
        recent_failures = await db.events.count_documents({
            "source_ip": event.source_ip,
            "event_type": "login_failed",
            "timestamp": {"$gte": datetime.now(ASUNCION_TZ) - timedelta(minutes=5)}
        })
        
        if recent_failures >= 3:
            alert = Alert(
                event_id=event.id,
                rule_name="Múltiples Intentos de Login Fallidos",
                severity="high",
                status="open"
            )
            await db.alerts.insert_one(alert.dict())
            alerts_generated.append(alert)
    
    # Marcar evento como procesado
    await db.events.update_one(
        {"id": event.id},
        {"$set": {"processed": True}}
    )
    
    return alerts_generated

# Rutas de autenticación
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Verificar si el usuario ya existe
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    user = User(**user_data.dict())
    
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        # Registrar intento de login fallido
        failed_event = SecurityEvent(
            source_ip="127.0.0.1",  # En producción obtener IP real
            event_type="login_failed",
            severity="medium",
            username=user_credentials.email,
            description=f"Intento de login fallido para usuario {user_credentials.email}"
        )
        await db.events.insert_one(failed_event.dict())
        background_tasks.add_task(process_security_event, failed_event)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    
    user_obj = User(**user)
    
    # Verificar 2FA si está habilitado
    if user_obj.requires_2fa:
        if not user_credentials.codigo_2fa:
            # Generar y enviar código 2FA
            code = generate_2fa_code()
            verification = EmailVerificationCode(
                email=user_obj.email,
                code=code,
                expires_at=datetime.now(ASUNCION_TZ) + timedelta(minutes=5)
            )
            await db.email_codes.insert_one(verification.dict())
            await send_2fa_email(user_obj.email, code)
            
            return {"requires_2fa": True, "message": "Código 2FA enviado a tu email"}
        else:
            # Verificar código 2FA
            verification = await db.email_codes.find_one({
                "email": user_obj.email,
                "code": user_credentials.codigo_2fa,
                "used": False,
                "expires_at": {"$gt": datetime.now(ASUNCION_TZ)}
            })
            
            if not verification:
                raise HTTPException(status_code=400, detail="Código 2FA inválido o expirado")
            
            # Marcar código como usado
            await db.email_codes.update_one(
                {"id": verification["id"]},
                {"$set": {"used": True}}
            )
    
    # Actualizar último login
    await db.users.update_one(
        {"email": user_obj.email},
        {"$set": {"last_login": datetime.now(ASUNCION_TZ)}}
    )
    
    # Registrar evento de login exitoso
    success_event = SecurityEvent(
        source_ip="127.0.0.1",
        event_type="login_success",
        severity="info",
        username=user_obj.email,
        description=f"Login exitoso para usuario {user_obj.email}"
    )
    await db.events.insert_one(success_event.dict())
    background_tasks.add_task(process_security_event, success_event)
    
    # Crear token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_obj
    }

# Rutas de eventos
@api_router.post("/events", response_model=SecurityEvent)
async def create_event(event: SecurityEvent, background_tasks: BackgroundTasks):
    await db.events.insert_one(event.dict())
    background_tasks.add_task(process_security_event, event)
    return event

@api_router.get("/events", response_model=List[SecurityEvent])
async def get_events(
    skip: int = 0, 
    limit: int = 100, 
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    filter_dict = {}
    if severity:
        filter_dict["severity"] = severity
    if event_type:
        filter_dict["event_type"] = event_type
    
    events = await db.events.find(filter_dict).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return [SecurityEvent(**event) for event in events]

# Rutas de alertas
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    
    alerts = await db.alerts.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Alert(**alert) for alert in alerts]

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str, 
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.now(ASUNCION_TZ),
            "resolved_by": current_user.email,
            "notes": notes
        }}
    )
    return {"message": "Alerta resuelta"}

# Dashboard y estadísticas
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    now = datetime.now(ASUNCION_TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    # Estadísticas de eventos
    total_events_today = await db.events.count_documents({
        "timestamp": {"$gte": today_start}
    })
    
    total_events_week = await db.events.count_documents({
        "timestamp": {"$gte": week_start}
    })
    
    # Alertas abiertas
    open_alerts = await db.alerts.count_documents({"status": "open"})
    
    # Intentos fallidos de login hoy
    failed_logins_today = await db.events.count_documents({
        "timestamp": {"$gte": today_start},
        "event_type": "login_failed"
    })
    
    # Top alertas por tipo
    top_alerts_pipeline = [
        {"$match": {"created_at": {"$gte": week_start}}},
        {"$group": {"_id": "$rule_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    
    top_alerts_cursor = db.alerts.aggregate(top_alerts_pipeline)
    top_alerts = await top_alerts_cursor.to_list(5)
    
    return {
        "eventos_hoy": total_events_today,
        "eventos_semana": total_events_week,
        "alertas_abiertas": open_alerts,
        "logins_fallidos_hoy": failed_logins_today,
        "top_alertas": top_alerts
    }

# Generación de reportes PDF
@api_router.get("/reports/monthly")
async def generate_monthly_report(
    year: int, 
    month: int,
    current_user: User = Depends(get_current_user)
):
    # Calcular rango de fechas
    start_date = datetime(year, month, 1, tzinfo=ASUNCION_TZ)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=ASUNCION_TZ)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=ASUNCION_TZ)
    
    # Recopilar datos
    total_events = await db.events.count_documents({
        "timestamp": {"$gte": start_date, "$lt": end_date}
    })
    
    critical_incidents = await db.alerts.count_documents({
        "created_at": {"$gte": start_date, "$lt": end_date},
        "severity": "critical"
    })
    
    # Crear PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
    )
    
    story.append(Paragraph(f"Reporte Mensual de Seguridad - {month}/{year}", title_style))
    story.append(Spacer(1, 12))
    
    # Información del reporte
    report_time = datetime.now(ASUNCION_TZ).strftime("%Y-%m-%d %H:%M:%S")
    story.append(Paragraph(f"<b>Fecha de generación:</b> {report_time} (TZ América/Asunción)", styles['Normal']))
    story.append(Paragraph(f"<b>Período cubierto:</b> {start_date.strftime('%Y-%m-%d')} a {end_date.strftime('%Y-%m-%d')}", styles['Normal']))
    story.append(Paragraph(f"<b>Versión del informe:</b> 1.0", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Principales hallazgos
    story.append(Paragraph("<b>Principales Hallazgos</b>", styles['Heading2']))
    story.append(Paragraph(f"• Total de eventos registrados: {total_events}", styles['Normal']))
    story.append(Paragraph(f"• Incidentes críticos: {critical_incidents}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Recomendaciones
    story.append(Paragraph("<b>Recomendaciones Clave</b>", styles['Heading2']))
    story.append(Paragraph("• Mantener actualizadas las políticas de seguridad", styles['Normal']))
    story.append(Paragraph("• Revisar accesos fuera de horario laboral", styles['Normal']))
    story.append(Paragraph("• Implementar capacitación en ciberseguridad", styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        BytesIO(buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_mensual_{month}_{year}.pdf"}
    )

# Consejos de seguridad
@api_router.get("/security-tips")
async def get_security_tips():
    tips = [
        {
            "titulo": "Contraseñas Seguras",
            "descripcion": "Usa contraseñas complejas con al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.",
            "categoria": "Autenticación"
        },
        {
            "titulo": "Autenticación de Dos Factores",
            "descripcion": "Habilita 2FA en todas las cuentas importantes para agregar una capa extra de seguridad.",
            "categoria": "Autenticación"
        },
        {
            "titulo": "Actualizaciones de Software",
            "descripcion": "Mantén todos los sistemas y aplicaciones actualizados con los últimos parches de seguridad.",
            "categoria": "Mantenimiento"
        },
        {
            "titulo": "Monitoreo de Accesos",
            "descripcion": "Revisa regularmente los logs de acceso y reporta cualquier actividad sospechosa.",
            "categoria": "Monitoreo"
        },
        {
            "titulo": "Backup de Datos",
            "descripcion": "Realiza copias de seguridad regulares y verifica que puedan restaurarse correctamente.",
            "categoria": "Continuidad"
        }
    ]
    return tips

# Inicialización de datos demo
async def create_demo_data():
    """Crear datos de demostración realistas"""
    # Verificar si ya existen datos
    existing_events = await db.events.count_documents({})
    if existing_events > 0:
        return
    
    logger.info("Creando datos de demostración...")
    
    # Crear usuario admin por defecto
    admin_exists = await db.users.find_one({"email": "admin@pymesiem.com"})
    if not admin_exists:
        admin_user = User(
            email="admin@pymesiem.com",
            nombre_completo="Administrador SIEM",
            rol="admin",
            requires_2fa=True
        )
        admin_dict = admin_user.dict()
        admin_dict["hashed_password"] = get_password_hash("admin123")
        await db.users.insert_one(admin_dict)
    
    # Eventos de demostración
    demo_events = []
    now = datetime.now(ASUNCION_TZ)
    
    # Eventos de las últimas 24 horas
    for i in range(50):
        event_time = now - timedelta(hours=i * 0.5)
        
        # Diferentes tipos de eventos
        if i % 7 == 0:  # Intento de login fallido
            event = SecurityEvent(
                timestamp=event_time,
                source_ip=f"192.168.1.{100 + (i % 50)}",
                source_name=f"WORKSTATION-{i:02d}",
                event_type="login_failed",
                severity="medium",
                username=f"usuario{i % 10}",
                description=f"Intento de login fallido desde {event_time.strftime('%H:%M')}"
            )
        elif i % 11 == 0:  # Acceso fuera de horario
            late_time = now.replace(hour=22, minute=30) - timedelta(days=i % 3)
            event = SecurityEvent(
                timestamp=late_time,
                source_ip=f"10.0.0.{50 + (i % 20)}",
                source_name=f"SERVER-{i % 3}",
                event_type="access_granted",
                severity="high",
                username="admin_nocturno",
                description=f"Acceso administrativo fuera de horario laboral a las {late_time.strftime('%H:%M')}"
            )
        else:  # Eventos normales
            event = SecurityEvent(
                timestamp=event_time,
                source_ip=f"192.168.0.{10 + (i % 30)}",
                source_name=f"PC-{i % 20:02d}",
                event_type="access_granted" if i % 2 == 0 else "system_change",
                severity="info",
                username=f"empleado{i % 15}",
                description=f"Actividad normal del sistema a las {event_time.strftime('%H:%M')}"
            )
        
        demo_events.append(event.dict())
    
    await db.events.insert_many(demo_events)
    logger.info(f"Insertados {len(demo_events)} eventos de demostración")

@app.on_event("startup")
async def startup_event():
    await create_demo_data()

# Incluir router
app.include_router(api_router)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)