import requests
import time
import threading
import io
import math
from flask import Flask, jsonify
from pyproj import Transformer

app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


BUS_RT_URL = "http://data.itsfactory.fi/journeys/api/1/gtfs-rt/vehicle-positions/json"
BUS_RT_HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json'
}

WFS_STOP_URL = "https://geodata.tampere.fi/geoserver/joukkoliikenne/wfs"
WFS_STOP_PARAMS = {
    "service": "WFS",
    "version": "2.0.0",
    "request": "GetFeature",
    "typeNames": "joukkoliikenne:joli_bussi_ja_ratikkapysakit_gsview",
    "outputFormat": "application/json"
}

#converting finnish coordinates
transformer = Transformer.from_crs("EPSG:3067", "EPSG:4326", always_xy=True)

bus_data = []
stops_data = []

#occupancy of all buses
bus_state = {}


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))


def calculate_speed_kmh(prev_pos, prev_t, now_pos, now_t):
    if prev_pos is None or prev_t is None:
        return 0.0
    d = haversine_m(prev_pos[0], prev_pos[1], now_pos[0], now_pos[1])
    dt = max(1e-6, now_t - prev_t)
    mps = d / dt
    return mps * 3.6


def estimate_occupancy(bus_id, lat, lng):
    now_t = time.time()
    now_pos = (lat, lng)

    s = bus_state.get(bus_id)
    if not s:
        bus_state[bus_id] = {
            "last_pos": now_pos,
            "last_t": now_t,
            "speed": 0.0,
            "stopped_since": None,
            "occupancy": 20
        }
        return 20

    prev_pos = s["last_pos"]
    prev_t = s["last_t"]
    prev_speed = s["speed"]

    speed = calculate_speed_kmh(prev_pos, prev_t, now_pos, now_t)

    #stop detection
    if speed < 2.0:
        if s["stopped_since"] is None:
            s["stopped_since"] = now_t
        stop_duration = now_t - s["stopped_since"]
    else:
        stop_duration = 0.0
        s["stopped_since"] = None

    #occupancy estimation from gps data
    jerk = abs(speed - prev_speed)
    speed_score = max(0.0, 30.0 - min(speed, 30.0))
    stop_score = min(stop_duration, 20.0)
    jerk_score = min(jerk, 10.0)
    hour = time.localtime().tm_hour
    rush = 10.0 if (7 <= hour <= 9 or 15 <= hour <= 17) else 0.0

    raw = jerk_score * 3 + stop_score * 2 + speed_score * 1 + rush
    raw = max(0.0, min(raw, 100.0))

    #ema smoothing
    prev_occ = s["occupancy"]
    smoothed = prev_occ * 0.7 + raw * 0.3
    smoothed = max(0.0, min(smoothed, 100.0))

    s["last_pos"] = now_pos
    s["last_t"] = now_t
    s["speed"] = speed
    s["occupancy"] = smoothed

    return int(round(smoothed))


def extract_coordinates(geometry):
    coords = geometry.get("coordinates")
    gtype = geometry.get("type", "")
    if gtype == "Point":
        return coords[0], coords[1]
    if gtype == "MultiPoint":
        return coords[0][0], coords[0][1]
    while isinstance(coords[0], list):
        coords = coords[0]
    return coords[0], coords[1]


def load_wfs_stops():
    global stops_data
    try:
        resp = requests.get(WFS_STOP_URL, params=WFS_STOP_PARAMS, timeout=12)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print("WFS fetch failed:", e)
        stops_data = []
        return

    features = data.get("features", [])
    stops = []

    for f in features:
        props = f.get("properties", {})
        geom = f.get("geometry")

        try:
            x, y = extract_coordinates(geom)
            lon, lat = transformer.transform(x, y)
        except:
            continue

        stops.append({
            "id": props.get("tunniste"),
            "name": props.get("nimi") or "",
            "lat": lat,
            "lng": lon,
            "municipality": props.get("kunta"),
            "zone": props.get("tariffivyohyke"),
            "routes": []      # ALWAYS EMPTY NOW
        })

    stops_data = stops
    print("Loaded", len(stops_data), "stops.")


def update_vehicle_data_loop():
    global bus_data
    while True:
        try:
            resp = requests.get(BUS_RT_URL, headers=BUS_RT_HEADERS, timeout=8)
            resp.raise_for_status()
            data = resp.json()

            vehicles = []

            for entity in data.get("entity", []):
                v = entity.get("vehicle", {})
                pos = v.get("position", {})
                meta = v.get("vehicle", {})

                vid = meta.get("id")
                if not vid:
                    continue

                lat = pos.get("latitude")
                lng = pos.get("longitude")
                if lat is None or lng is None:
                    continue

                occ = estimate_occupancy(str(vid), lat, lng)

                vehicles.append({
                    "id": str(vid),
                    "lat": lat,
                    "lng": lng,
                    "occupancy": occ,
                })

            bus_data = vehicles

        except Exception as e:
            print("Bus fetch error:", e)

        time.sleep(2)


@app.route("/buses")
def api_buses():
    return jsonify(bus_data)

@app.route("/stops")
def api_stops():
    return jsonify(stops_data)

def startup():
    load_wfs_stops()

    t = threading.Thread(target=update_vehicle_data_loop, daemon=True)
    t.start()

startup()


if __name__ == "__main__":
    print("Server running on http://127.0.0.1:8080")
    app.run(debug=True, host="127.0.0.1", port=8080)
