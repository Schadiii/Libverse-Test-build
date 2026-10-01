import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
PANORAMA_DIR = os.path.join(ASSETS_DIR, "360")
MAP_DIR = os.path.join(ASSETS_DIR, "maps")

os.makedirs(PANORAMA_DIR, exist_ok=True)
os.makedirs(MAP_DIR, exist_ok=True)

app = FastAPI(
    title="Libverse 360 Tour API",
    description="Backend for the Libverse 360 directory and mall-kiosk UI.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets/360", StaticFiles(directory=PANORAMA_DIR), name="360_assets")
app.mount("/assets/maps", StaticFiles(directory=MAP_DIR), name="map_assets")


@app.get("/")
def root_status():
    return {"status": "Libverse Server is online and operational."}


@app.get("/api/floors")
def get_floors():
    files = []

    if not os.path.isdir(DATA_DIR):
        return {"floors": files}

    for filename in sorted(os.listdir(DATA_DIR)):
        if filename.endswith("_nodes.json"):
            files.append(filename.removesuffix("_nodes.json"))

    return {"floors": files}


@app.get("/api/floors/{floor_id}/nodes")
def get_floor_nodes(floor_id: str):
    json_path = os.path.join(DATA_DIR, f"{floor_id}_nodes.json")

    if not os.path.exists(json_path):
        raise HTTPException(
            status_code=404,
            detail=f"Node map file '{floor_id}_nodes.json' was not found.",
        )

    try:
        with open(json_path, "r", encoding="utf-8") as file:
            node_data = json.load(file)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in {floor_id}_nodes.json: {error}",
        ) from error

    return {
        "floor": floor_id,
        "total_nodes": len(node_data),
        "nodes": node_data,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "LibverseServer:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
