from fastapi import FastAPI
from routes.servicios import router as servicios_router
from routes.auth import router as auth_router

app = FastAPI()
@app.get("/")
def saludar():
    return {"mensaje": "¡Hola! Bienvenido a mi API"}
@app.get("/bienvenido/{nombre}")
def saludar_persona(nombre: str):
    return {"mensaje": f"Hola {nombre}, ¡qué bueno verte por aquí!"}

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]
@app.get("/servicios")
def listar_servicios():
    return {
        "servicios": servicios_db
    }
@app.post("/agregar-servicio")
def agregar_servicio(nuevo: dict):
    servicios_db.append(nuevo)
    return {
        "mensaje": "¡Servicio guardado!"
    }
