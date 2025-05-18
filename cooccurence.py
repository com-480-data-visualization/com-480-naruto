import yaml
import pandas as pd

with open('merged.yaml', 'r', encoding="utf-8") as file:
    configuration = yaml.safe_load(file)

df = pd.DataFrame(configuration)
#print(db.columns)
#print(db["opponents"])

duplicate_rows = []

# for idx, row in db.iterrows():
#     raw_opponents = row['opponents']
    
#     # Step 1: Parse if string
#     if isinstance(raw_opponents, str):
#         try:
#             opponents = ast.literal_eval(raw_opponents)
#         except Exception:
#             print(f"⚠️ Row {idx} skipped due to unparsable opponents: {raw_opponents}")
#             continue
#     else:
#         opponents = raw_opponents

#     # Step 2: Validate structure
#     if not isinstance(opponents, list) or not all(isinstance(team, list) for team in opponents):
#         print(f"⚠️ Row {idx} skipped due to invalid structure: {opponents}")
#         continue

#     # Step 3: Check for duplicate teams (unordered duplicates)
#     seen_teams = set()
#     has_duplicate = False
#     for team in opponents:
#         frozen = frozenset(team)
#         if frozen in seen_teams:
#             has_duplicate = True
#             break
#         seen_teams.add(frozen)
    
#     if has_duplicate:
#         duplicate_rows.append((idx, opponents))
#         print(f"❌ Row {idx} skipped due to duplicate teams: {opponents}")
#         continue

# print(db.loc[376])


import ast

# Function to check if a row has valid opponents structure
def is_valid_opponents(opponents):
    if isinstance(opponents, str):
        try:
            opponents = ast.literal_eval(opponents)
        except:
            return False
    if not isinstance(opponents, list):
        return False
    if not all(isinstance(team, list) for team in opponents):
        return False
    return True

# Apply the filter
valid_mask = df['opponents'].apply(is_valid_opponents)
df_clean = df[valid_mask].copy()  # keep only valid rows

# Optional: reset index if you want clean indexing
df_clean.reset_index(drop=True, inplace=True)

# Print how many rows were dropped
print(f"Dropped {len(df) - len(df_clean)} rows due to invalid opponents structure.")

df_clean = df_clean[df_clean['no_battles'] != True].copy()

import json
from collections import defaultdict
from itertools import combinations, product

co_occurrence = defaultdict(lambda: {'count': 0, 'battles': []})
all_names = set()

for _, row in df_clean.iterrows():
    opponents = row['opponents']
    episode_number = row['episode_number']
    outcome = row['outcome']
    description = row['description']

    # If it's still a string (just in case), evaluate it
    if isinstance(opponents, str):
        try:
            opponents = ast.literal_eval(opponents)
        except:
            continue

    # Skip if not at least 2 teams
    if not isinstance(opponents, list) or len(opponents) < 2:
        continue

    # Count fights between all pairs of teams
    for team1, team2 in combinations(opponents, 2):
        for name1, name2 in product(team1, team2):
            pair = tuple(sorted((name1, name2)))
            co_occurrence[pair]['count'] += 1
            co_occurrence[pair]['battles'].append({
                'episode': episode_number,
                'outcome': outcome,
                'description': description
            })
            all_names.update([name1, name2])

# Build JSON structure
nodes = [{"name": name} for name in sorted(all_names)]
name_to_index = {node['name']: i for i, node in enumerate(nodes)}

links = []
for (name1, name2), data in co_occurrence.items():
    links.append({
        "source": name_to_index[name1],
        "target": name_to_index[name2],
        "value": data['count'],
        "battles": data['battles']
    })

output = {
    "nodes": nodes,
    "links": links
}

# Write to file
with open("character_fights_with_battles.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("✅ character_fights_with_battles.json successfully created with battle details.")

from collections import Counter

# Count total appearance per character in links
char_counter = Counter()

for (src, tgt), data in co_occurrence.items():
    char_counter[src] += data['count']
    char_counter[tgt] += data['count']

# Filter characters appearing more than 15 times (adjust as needed)
frequent_chars = {char for char, count in char_counter.items() if count > 15}

# Create nodes list with just frequent characters
nodes = [{"name": name} for name in sorted(frequent_chars)]
name_to_index = {node['name']: i for i, node in enumerate(nodes)}

# Create links using integer indices, including battle info
links = []
for (name1, name2), data in co_occurrence.items():
    if name1 in name_to_index and name2 in name_to_index:
        links.append({
            "source": name_to_index[name1],
            "target": name_to_index[name2],
            "value": data['count'],
            "battles": data['battles']
        })

output = {
    "nodes": nodes,
    "links": links
}

with open("character_fights_filtered_with_battles.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✅ Exported {len(nodes)} nodes and {len(links)} links with battle details.")