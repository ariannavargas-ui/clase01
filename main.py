from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.servicios import router as servicios_router
from routes.auth import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def saludar():
    return {"mensaje": "¡Hola! Bienvenido a mi API"}

@app.get("/bienvenido/{nombre}")
def saludar_persona(nombre: str):
    return {"mensaje": f"Hola {nombre}, ¡qué bueno verte por aquí!"}

app.include_router(auth_router)
app.include_router(servicios_router)

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
