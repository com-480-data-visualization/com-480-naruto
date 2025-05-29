import json
from collections import defaultdict

# Input/output files
input_file = 'battles_expanded_teams.json'
output_file = 'battles_top55.json'
top_n = 55

# === Load data ===
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['nodes']
links = data['links']

# === Step 1: Count total battle involvement per character ===
battle_count = defaultdict(int)

for link in links:
    battle_count[link["source"]] += link["value"]
    battle_count[link["target"]] += link["value"]

# === Step 2: Get top N character indices ===
top_indices = sorted(battle_count, key=battle_count.get, reverse=True)[:top_n]
top_set = set(top_indices)

# === Step 3: Build new node list and index mapping ===
new_nodes = []
old_to_new_index = {}

for old_index in top_indices:
    new_index = len(new_nodes)
    old_to_new_index[old_index] = new_index
    new_nodes.append(nodes[old_index])

# === Step 4: Filter and remap links ===
new_links = []

for link in links:
    src, tgt = link["source"], link["target"]
    if src in top_set and tgt in top_set:
        new_links.append({
            "source": old_to_new_index[src],
            "target": old_to_new_index[tgt],
            "value": link["value"],
            "battles": link["battles"]
        })

# === Step 5: Write new JSON ===
output_data = {
    "nodes": new_nodes,
    "links": new_links
}

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"[✓] Filtered top {top_n} characters and saved to {output_file}")
