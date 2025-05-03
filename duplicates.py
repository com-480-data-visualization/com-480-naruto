import json
from collections import defaultdict

# Load your JSON data (replace with your actual filename if needed)
with open("/Users/annalavrenko/Documents/GitHub/com-480-naruto/cooccurrence/naruto.json", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data["nodes"]
links = data["links"]

# Step 1: Build name -> index map
name_to_index = {node["name"]: idx for idx, node in enumerate(nodes)}

# Step 2: Define duplicates (map duplicate_name -> canonical_name)
duplicate_mapping = {
    "Kakashi Hatake": "Kakashi",
    "Naruto Uzumaki": "Naruto",
    "Sakura Haruno": "Sakura",
    "Sasuke Uchiha": "Sasuke",
    "Madara Uchiha": "Madara",
    "Might Guy": "Guy",
    "Killer B": "B",
    "Kabuto Yakushi": "Kabuto",
    "Pain (Deva Path)": "Nagato",
    "Tobi": "Obito"
}

# Step 3: Create index map from old index to new (merged) index
index_map = {}  # maps old index to canonical index
for dup, canon in duplicate_mapping.items():
    dup_idx = name_to_index.get(dup)
    canon_idx = name_to_index.get(canon)
    if dup_idx is not None and canon_idx is not None:
        index_map[dup_idx] = canon_idx

# Step 4: Remap links
new_links = []
link_counter = defaultdict(int)

for link in links:
    src = index_map.get(link["source"], link["source"])
    tgt = index_map.get(link["target"], link["target"])
    if src != tgt:
        key = tuple(sorted((src, tgt)))  # undirected graph key
        link_counter[key] += link["value"]

# Step 5: Collapse links with combined values
for (src, tgt), val in link_counter.items():
    new_links.append({
        "source": src,
        "target": tgt,
        "value": val
    })

# Step 6: Remove duplicate nodes
nodes_to_remove = set(index_map.keys())
new_nodes = [node for idx, node in enumerate(nodes) if idx not in nodes_to_remove]

# Step 7: Re-index nodes
old_to_new_index = {}
for new_idx, node in enumerate(new_nodes):
    old_idx = name_to_index[node["name"]]
    old_to_new_index[old_idx] = new_idx

# Step 8: Update link indices to match new node list
final_links = []
for link in new_links:
    try:
        src_new = old_to_new_index[link["source"]]
        tgt_new = old_to_new_index[link["target"]]
        final_links.append({
            "source": src_new,
            "target": tgt_new,
            "value": link["value"]
        })
    except KeyError:
        continue  # skip any links where either endpoint was removed unexpectedly

# Final graph
merged_graph = {
    "nodes": new_nodes,
    "links": final_links
}

# Save the merged result
with open("naruto_fin.json", "w", encoding="utf-8") as f:
    json.dump(merged_graph, f, indent=2, ensure_ascii=False)