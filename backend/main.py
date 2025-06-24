import sys
import re
import platform
import subprocess
import asyncio
from typing import List
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import aiohttp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def fetch_geo(session, ip):
    url = f"http://ip-api.com/json/{ip}"
    async with session.get(url) as resp:
        return await resp.json()

def parse_traceroute_output(output: str) -> List[dict]:
    hops = []
    lines = output.splitlines()
    ipv4_re = r"(\d+\.\d+\.\d+\.\d+)"
    ipv6_re = r"([a-fA-F0-9:]+)"
    for line in lines:
        if 'Request timed out.' in line:
            continue
        # Windows tracert (IPv4 or IPv6)
        m = re.search(r"\s*(\d+)\s+<*([\d]+|\*)\s*ms\s+<*([\d]+|\*)\s*ms\s+<*([\d]+|\*)\s*ms\s+" + ipv6_re, line)
        if m:
            ip = m.group(5)
            # Get the minimum ping that is not '*'
            pings = [p for p in [m.group(2), m.group(3), m.group(4)] if p != '*']
            ping = int(min(pings, default='0')) if pings else None
            hops.append({"ip": ip, "ping": ping})
            continue
        # Unix traceroute (IPv4 or IPv6)
        m = re.search(r"\s*(\d+)\s+" + ipv6_re + r"\s+([\d.]+)\s+ms", line)
        if m:
            ip = m.group(2)
            ping = float(m.group(3))
            hops.append({"ip": ip, "ping": ping})
    # Fallback: extract all IPs (IPv4 or IPv6)
    if not hops:
        for line in lines:
            if 'Request timed out.' in line:
                continue
            m = re.search(ipv4_re + '|' + ipv6_re, line)
            if m:
                ip = m.group(0)
                hops.append({"ip": ip, "ping": None})
    return hops

@app.get("/traceroute")
async def traceroute(target: str = Query(...)):
    system = platform.system().lower()
    if system.startswith("win"):
        cmd = ["tracert", "-d", target]
    else:
        cmd = ["traceroute", "-n", target]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        outs, errs = proc.communicate()
        print("TRACEROUTE OUTPUT:")
        print(outs)
    except subprocess.TimeoutExpired:
        proc.kill()
        return {"error": "Traceroute timed out."}
    hops = parse_traceroute_output(outs)
    async with aiohttp.ClientSession() as session:
        tasks = []
        for hop in hops:
            ip = hop["ip"]
            tasks.append(fetch_geo(session, ip))
        geo_results = await asyncio.gather(*tasks, return_exceptions=True)
    result = []
    for hop, geo in zip(hops, geo_results):
        if isinstance(geo, Exception) or geo is None or geo.get("status") != "success":
            # If geolocation fails, return hop with just IP and ping
            result.append({
                "ip": hop["ip"],
                "lat": None,
                "lon": None,
                "country": None,
                "countryCode": None,
                "isp": None,
                "ping": hop["ping"]
            })
        else:
            result.append({
                "ip": hop["ip"],
                "lat": geo.get("lat"),
                "lon": geo.get("lon"),
                "country": geo.get("country"),
                "countryCode": geo.get("countryCode"),
                "isp": geo.get("isp"),
                "ping": hop["ping"]
            })
    return result 