#!/usr/bin/env python3
"""Generate Gauntlet OG share card via xAI Images API."""
import base64
import json
import os
import sys
import urllib.request
import urllib.error

API_KEY = os.environ.get("XAI_API_KEY")
if not API_KEY:
    print("XAI_API_KEY missing", file=sys.stderr)
    sys.exit(1)

PROMPT = (
    "A cinematic editorial still-life photograph used as a wide share-card cover. "
    "Dead-center in the frame, the word \"GAUNTLET\" in large refined steel-colored "
    "sans-serif capital letters, the lettering spanning about half to two-thirds of "
    "the width with generous empty margins on every side. Directly underneath, smaller "
    "muted paper-gray text reading \"Drop the mess. Walk away.\" "
    "The scene is a dark warm-black mission-control desk: cream paper documents, "
    "steel instruments, and ink on an elevated charcoal surface. Behind the type, a "
    "faint geometric three-node loop of thin steel hairlines — three connected nodes "
    "suggesting a quiet lead-build-critic cycle. Soft cinematic lighting, paper-white "
    "and steel accents only, no people, no faces, no neon, no purple, no gold. "
    "Quiet, editorial, control-room atmosphere. Title lockup perfectly centered both ways."
)

body = {
    "model": "grok-imagine-image-quality",
    "prompt": PROMPT,
    "aspect_ratio": "2:1",
    "response_format": "b64_json",
}

req = urllib.request.Request(
    "https://api.x.ai/v1/images/generations",
    data=json.dumps(body).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    },
    method="POST",
)

print("Requesting image generation...", flush=True)
try:
    with urllib.request.urlopen(req, timeout=180) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace")
    print(f"HTTP {e.code}: {err}", file=sys.stderr)
    sys.exit(1)

out_path = sys.argv[1] if len(sys.argv) > 1 else "artifacts/card-raw.png"

# Handle b64_json or url
data = payload.get("data") or []
if not data:
    print(json.dumps(payload, indent=2)[:2000], file=sys.stderr)
    sys.exit(1)

item = data[0]
if item.get("b64_json"):
    raw = base64.b64decode(item["b64_json"])
    with open(out_path, "wb") as f:
        f.write(raw)
    print(f"Wrote {out_path} ({len(raw)} bytes)", flush=True)
elif item.get("url"):
    print(f"Fetching URL {item['url'][:80]}...", flush=True)
    with urllib.request.urlopen(item["url"], timeout=60) as img:
        raw = img.read()
    with open(out_path, "wb") as f:
        f.write(raw)
    print(f"Wrote {out_path} ({len(raw)} bytes)", flush=True)
else:
    print(json.dumps(payload, indent=2)[:2000], file=sys.stderr)
    sys.exit(1)
