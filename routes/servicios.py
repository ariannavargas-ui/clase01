from fastapi import APIRouter

router = APIRouter()

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

mascotas_db = []

@router.get("/servicios")
def listar_servicios():
    return {
        "servicios": servicios_db
    }

@router.post("/agregar-servicio")
def agregar_servicio(nuevo: dict):
    servicios_db.append(nuevo)
    return {
        "mensaje": "¡Servicio guardado!"
    }

@router.post("/registrar-mascota")
def registrar_mascota(correo: str, nombre_mascota: str, tipo_servicio: str, fecha: str):
    mascotas_db.append({
        "correo": correo,
        "nombre_mascota": nombre_mascota,
        "tipo_servicio": tipo_servicio,
        "fecha": fecha
    })
    return {
        "mensaje": "Mascota registrada exitosamente"
    }

@router.get("/mascotas/{correo}")
def listar_mascotas_usuario(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    return {
        "mascotas": mascotas_usuario
    }

@router.get("/reporte/{correo}")
def reporte_usuario(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    numero_servicios = len(mascotas_usuario)
    servicios = [m["tipo_servicio"] for m in mascotas_usuario]
    precios = {s["nombre"]: s["precio"] for s in servicios_db}
    total_gastado = sum(precios.get(s, 0) for s in servicios)
    return {
        "numero_servicios": numero_servicios,
        "servicios": servicios,
        "total_gastado": total_gastado
    }