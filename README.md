# Raptor: Call of the Shadows Clone

A web-based clone of the classic vertical scroller game "Raptor: Call of the Shadows" by Apogee Software.

## Description

This project is a modern web-based recreation of the classic DOS game "Raptor: Call of the Shadows". It features:

- Vertical scrolling gameplay
- Player-controlled spaceship
- Enemy ships with different movement patterns
- Shooting mechanics
- Score tracking

## Technologies Used

- **Backend**: FastAPI with Jinja2 templates
- **Frontend**: HTML5, CSS, JavaScript
- **Game Engine**: Phaser 3
- **Graphics**: SVG vector graphics
- **Containerization**: Docker

## Prerequisites

To run this application, you need either:

- Docker and Docker Compose (recommended)

OR

- Python 3.9 or higher
- Node.js and npm (for development)

## Running with Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed on your system.
2. Clone this repository.
3. Open a terminal in the project root directory.
4. Run the following command:

```bash
docker-compose up
```

5. Open your browser and navigate to `http://localhost:8000`

## Running without Docker

1. Make sure you have Python 3.9 or higher installed.
2. Clone this repository.
3. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

4. Install the required dependencies:

```bash
pip install -r requirements.txt
```

5. Run the application:

```bash
python src/main.py
```

6. Open your browser and navigate to `http://localhost:8000`

## Game Controls

- **Mouse Movement**: Control the player's ship
- **Left Mouse Button**: Shoot
- **Right Mouse Button**: Special weapon (not implemented yet)

## Development

To modify the game:

1. Edit the JavaScript files in `src/static/js/`
2. Edit the HTML templates in `src/templates/`
3. Edit the backend code in `src/main.py`

## License

This project is for educational purposes only. The original "Raptor: Call of the Shadows" is owned by its respective copyright holders.