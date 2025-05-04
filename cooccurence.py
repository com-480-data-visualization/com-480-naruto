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

co_occurrence = defaultdict(int)
all_names = set()

for _, row in df_clean.iterrows():
    opponents = row['opponents']

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
            co_occurrence[pair] += 1
            all_names.update([name1, name2])

# Build JSON structure
nodes = [{"name": name} for name in sorted(all_names)]
links = [{"source": src, "target": tgt, "value": val} for (src, tgt), val in co_occurrence.items()]

output = {
    "nodes": nodes,
    "links": links
}

# Write to file
with open("character_fights.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("✅ character_fights.json successfully created.")

from collections import Counter

# Step 1: Count total appearance per character in links
char_counter = Counter()

for (src, tgt), value in co_occurrence.items():
    char_counter[src] += value
    char_counter[tgt] += value

# Step 2: Filter characters appearing more than 3 times
frequent_chars = {char for char, count in char_counter.items() if count > 15}

# Step 1: Sort and assign index to each character
sorted_names = sorted(frequent_chars)
name_to_index = {name: i for i, name in enumerate(sorted_names)}

# Step 2: Create nodes list with just 'name'
nodes = [{"name": name} for name in sorted_names]

# Step 3: Create links using integer indices
links = [
    {"source": name_to_index[src], "target": name_to_index[tgt], "value": val}
    for (src, tgt), val in co_occurrence.items()
    if src in name_to_index and tgt in name_to_index
]

# Step 4: Export to JSON (UTF-8 safe)
output = {
    "nodes": nodes,
    "links": links
}

with open("character_fights_filtered.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✅ Exported {len(nodes)} nodes and {len(links)} links (names only, numeric links).")





