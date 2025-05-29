import json
from collections import defaultdict
from pathlib import Path

# === File paths ===
input_file = 'no_duplicates_naruto.json'
name_map_file = 'duplicate_names.json'
team_map_file = 'team_mapping.json'
output_file = 'battles_expanded_teams.json'

# === Load files ===
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(name_map_file, 'r', encoding='utf-8') as f:
    name_map = json.load(f)

with open(team_map_file, 'r', encoding='utf-8') as f:
    team_map = json.load(f)

# === Helper: Normalize a character name ===
def normalize_name(name):
    return name_map.get(name, name)

# === Helper: Expand a name (team or individual) into a list of normalized characters ===
def get_characters(name):
    if name in team_map:
        return [normalize_name(n) for n in team_map[name]]
    else:
        return [normalize_name(name)]

# === Step 1: Build new_nodes list ===
name_to_index = {}
new_nodes = []

def add_node(name):
    if name not in name_to_index:
        name_to_index[name] = len(new_nodes)
        new_nodes.append({"name": name})
    return name_to_index[name]

# === Step 2: Expand links ===
merged_links = {}

for link in data["links"]:
    source_raw = data["nodes"][link["source"]]["name"]
    target_raw = data["nodes"][link["target"]]["name"]

    source_chars = get_characters(source_raw)
    target_chars = get_characters(target_raw)

    if not source_chars or not target_chars:
        continue  # Skip if one side has no characters defined

    for src in source_chars:
        for tgt in target_chars:
            if src == tgt:
                continue  # Skip self-fights
            s_idx = add_node(src)
            t_idx = add_node(tgt)
            a, b = sorted([s_idx, t_idx])
            key = (a, b)

            if key not in merged_links:
                merged_links[key] = {
                    "source": a,
                    "target": b,
                    "value": 0,
                    "battles": []
                }

            merged_links[key]["value"] += link["value"]

            # Deduplicate battles using (episode, description)
            seen = set((b["episode"], b["description"]) for b in merged_links[key]["battles"])
            for battle in link["battles"]:
                b_key = (battle["episode"], battle["description"])
                if b_key not in seen:
                    merged_links[key]["battles"].append(battle)
                    seen.add(b_key)

# === Output ===
output_data = {
    "nodes": new_nodes,
    "links": list(merged_links.values())
}

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"[✓] Expanded battles written to: {output_file}")
