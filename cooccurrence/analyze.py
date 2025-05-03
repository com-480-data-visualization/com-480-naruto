import json

with open("/Users/annalavrenko/Documents/GitHub/com-480-naruto/cooccurrence/naruto_fin.json", "r", encoding="utf-8") as f:
    data = json.load(f)

values = [link["value"] for link in data["links"] if link["value"] > 0]

min_val = min(values)
max_val = max(values)
mid_val = min_val + (max_val - min_val) / 2

print(f"Min: {min_val}, Mid: {mid_val:.2f}, Max: {max_val}")
