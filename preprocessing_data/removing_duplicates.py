import json
from collections import defaultdict

# === File paths ===
input_file = 'character_fights_with_battles.json'
mapping_file = 'duplicate_names.json'
output_file = 'no_duplicates_naruto.json'

# === Load files ===
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(mapping_file, 'r', encoding='utf-8') as f:
    name_map = json.load(f)

# === Helper: get canonical name ===
def get_final_name(name):
    return name_map.get(name, name)  # Default to self if not in map

# === Step 1: Build new node list with unique names ===
name_to_index = {}
new_nodes = []

for node in data["nodes"]:
    final_name = get_final_name(node["name"])
    if final_name not in name_to_index:
        name_to_index[final_name] = len(new_nodes)
        new_nodes.append({"name": final_name})

# === Step 2: Rebuild links with updated indices and merge duplicates ===
merged_links = {}

for link in data["links"]:
    source_name = get_final_name(data["nodes"][link["source"]]["name"])
    target_name = get_final_name(data["nodes"][link["target"]]["name"])

    # Ensure source_id < target_id for consistent merging
    s_id = name_to_index[source_name]
    t_id = name_to_index[target_name]
    if s_id > t_id:
        s_id, t_id = t_id, s_id

    key = (s_id, t_id)

    if key not in merged_links:
        merged_links[key] = {
            "source": s_id,
            "target": t_id,
            "value": 0,
            "battles": []
        }

    merged_links[key]["value"] += link["value"]
    merged_links[key]["battles"].extend(link["battles"])

# === Final output ===
output = {
    "nodes": new_nodes,
    "links": list(merged_links.values())
}

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Updated file written to {output_file}")
