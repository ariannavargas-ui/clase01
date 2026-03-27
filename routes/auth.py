from fastapi import APIRouter

router = APIRouter()

users_db = []  # lista temporal para simular base de datos

@router.post("/register")
def register(correo: str, contraseña: str):
    users_db.append({"correo": correo, "contraseña": contraseña})
    return {"mensaje": "Registro exitoso", "correo": correo, "contraseña": contraseña}

@router.post("/login")
def login(correo: str, contraseña: str):
    users_db.append({"correo": correo, "contraseña": contraseña})
    return {"mensaje": "Login exitoso", "correo": correo, "contraseña": contraseña}