"""One-off: sample Natural Earth land polygons onto an even dot grid -> land_points.json.
usage: python build_land_points.py ne_110m_land.geojson
(source: github.com/nvkelso/natural-earth-vector, geojson/ne_110m_land.geojson)"""
import json
import math
import os
import sys

STEP = 4.5  # degrees between dots


def inside(lon, lat, ring):
    hit = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


def main():
    feats = json.load(open(sys.argv[1]))["features"]
    polys = []
    for f in feats:
        g = f["geometry"]
        for p in (g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]):
            xs = [c[0] for c in p[0]]
            ys = [c[1] for c in p[0]]
            polys.append((min(xs), max(xs), min(ys), max(ys), p))

    pts = []
    lat = -56.0
    while lat <= 80:
        n = max(1, round(360 / STEP * math.cos(math.radians(lat))))
        for k in range(n):
            lon = -180 + (k + 0.5) * 360 / n
            for x0, x1, y0, y1, p in polys:
                if x0 <= lon <= x1 and y0 <= lat <= y1 and inside(lon, lat, p[0]) and not any(inside(lon, lat, h) for h in p[1:]):
                    pts.append([round(lat, 1), round(lon, 1)])
                    break
        lat += STEP
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "land_points.json")
    json.dump(pts, open(out, "w"), separators=(",", ":"))
    print(f"{len(pts)} land points -> land_points.json")


if __name__ == "__main__":
    main()
