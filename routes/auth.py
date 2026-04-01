from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()

users_db = []  # lista temporal para simular base de datos

class UserCredentials(BaseModel):
    correo: EmailStr
    contrasena: str

@router.post("/register")
def register(data: UserCredentials):
    if any(u['correo'] == data.correo for u in users_db):
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    users_db.append(data.dict())
    return {"mensaje": "Registro exitoso", "correo": data.correo}

@router.post("/login")
def login(data: UserCredentials):
    user = next((u for u in users_db if u['correo'] == data.correo and u['contrasena'] == data.contrasena), None)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"mensaje": "Login exitoso", "correo": data.correo}