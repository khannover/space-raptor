from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import uvicorn

# Create FastAPI app
app = FastAPI(title="Raptor: Call of the Shadows Clone")

# Mount static files directory
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="src/templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """
    Render the main game page
    """
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)