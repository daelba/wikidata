from endpoints import *
import sys
import requests
from urllib.parse import urlparse

property = "P411"
itemFrom = "Q43115"
itemTo = "Q123110154"
summary = "Change target of P411: fix contraint violation"
user_agent = "Daniel Baránek/%s.%s" % (sys.version_info[0], sys.version_info[1])

def get_claims(item_id):
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{item_id}.json"
    r = requests.get(url, headers={"User-Agent": user_agent})
    return r.json()["entities"][item_id]["claims"].get(property, [])

def format_snaks(snaks):
    parts = []
    for prop, values in snaks.items():
        for snak in values:
            if snak["snaktype"] != "value":
                continue
            datavalue = snak["datavalue"]
            value = datavalue["value"]
            if datavalue["type"] == "wikibase-entityid":
                parts.append(f"|{prop}|{value['id']}")
            elif datavalue["type"] == "string":
                parts.append(f'|{prop}|"{value}"')
            elif datavalue["type"] == "time":
                parts.append(f'|{prop}|{value["time"]}/{value["precision"]}')
            # Add other types if needed
    return "".join(parts)

query = f'''SELECT ?item WHERE {{
  ?item p:{property} ?statement.
  ?statement ps:{property} wd:{itemFrom}.
  ?statement pq:P1027 [ wdt:P39 wd:Q19546 ].
}}'''
print(query)
result = get_bigData(endpoint_wd, query, offset=0, max=100000)

with open("change_target.txt", "w") as file:
    for r in result:
        item = r["item"]["value"].split("/")[-1]
        print(item)
        for claim in get_claims(item):
            mainsnak = claim["mainsnak"]
            if mainsnak["snaktype"] != "value":
                continue
            value = mainsnak["datavalue"]["value"]
            if value["id"] != itemFrom:
                continue
            statement_id = claim["id"]

            # Prepare REMOVE
            file.write(f"-{item}|{property}|{itemFrom} /* {summary} */\n")

            # Prepare ADD
            qualifiers = format_snaks(claim.get("qualifiers", {}))
            references = ""
            for ref in claim.get("references", []):
                references += format_snaks(ref.get("snaks", {})).replace("|P", "|S")
            file.write(f"{item}|{property}|{itemTo}{qualifiers}{references} /* {summary} */\n")
    
    
    
    
    
    


        
        