# Visual Traceroute

A full-stack app to visualize network traceroutes on a map.

## Features
- Enter a domain or IP to trace route.
- Visualize hops on a world map with IP, country, ISP, and latency.
- Interactive map with markers and polylines.

## Tech Stack
- **Frontend:** React, axios, leaflet, react-leaflet
- **Backend:** FastAPI, uvicorn, aiohttp

---

## Folder Structure
```
visual-traceroute/
├── backend/
│   └── main.py
├── frontend/
│   └── (React app files)
└── README.md
```

---

## Backend Setup

1. **Install dependencies:**
    ```bash
    cd visual-traceroute/backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install fastapi uvicorn aiohttp
    ```
2. **Run the server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will run at `http://localhost:8000`.

---

## Frontend Setup

1. **Install dependencies:**
    ```bash
    cd visual-traceroute/frontend
    npm install
    ```
2. **Start the React app:**
    ```bash
    npm start
    ```
    The frontend will run at `http://localhost:3000` and proxy API requests to the backend.

---

## Usage
- Open the frontend in your browser.
- Enter a domain or IP and click Trace.
- View the traceroute path and hop details on the map.

---

## Notes
- Ensure both frontend and backend are running for full functionality.
- The backend uses `traceroute -n` (Linux/macOS) or `tracert -d` (Windows). Modify as needed for your OS. 