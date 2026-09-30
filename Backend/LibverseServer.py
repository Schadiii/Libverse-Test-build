import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Libverse 360 Tour API",
    description="Backend service serving node graph data and 360 panorama assets for Pannellum."
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for 360 panorama images
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets", "360")
os.makedirs(ASSETS_DIR, exist_ok=True)
app.mount("/assets/360", StaticFiles(directory=ASSETS_DIR), name="360_assets")

# Static file serving for 2D floor maps
MAPS_DIR = os.path.join(os.path.dirname(__file__), "assets", "maps")
os.makedirs(MAPS_DIR, exist_ok=True)
app.mount("/assets/maps", StaticFiles(directory=MAPS_DIR), name="maps_assets")

@app.get("/")
def root_status():
    return {"status": "Libverse Server is online and operational."}


@app.get("/api/floors/{floor_id}/nodes")
def get_floor_nodes(floor_id: str):
    """
    Reads node map JSON generated from Node Maker.
    Example: GET /api/floors/eliboutside/nodes
    Looks for: backend/data/eliboutside_nodes.json
    """
    json_path = os.path.join(os.path.dirname(__file__), "data", f"{floor_id}_nodes.json")
    
    if not os.path.exists(json_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Node map file '{floor_id}_nodes.json' was not found in backend/data/ directory."
        )
    
    with open(json_path, "r", encoding="utf-8") as f:
        node_data = json.load(f)
        
    return {
        "floor": floor_id,
        "total_nodes": len(node_data),
        "nodes": node_data
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("LibverseServer:app", host="0.0.0.0", port=8000, reload=True)