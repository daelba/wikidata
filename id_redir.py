import requests
import time
import sys

from endpoints import *

headers = {"User-Agent": "Mozilla/5.0"}
property = sys.argv[1] if len(sys.argv) > 1 else None
if property is None:
    print("Error: first argument must be a property ID", file=sys.stderr)
    sys.exit(1)

url = sparql(endpoint_wd, f"SELECT DISTINCT ?url WHERE {{ wd:{property} wdt:P1630 ?url }}")["results"]["bindings"][0]["url"]["value"].split("$")[0]
print(property, url)

def check_redirects(id1, id2, stat1, stat2):
    for id, stat in ((id1, stat1), (id2, stat2)):
        response = requests.head(f"{url}{id}", headers=headers, allow_redirects=False)
        if response.status_code == 301 and response.headers.get("Location", "").split("/")[-1] == (id2 if id == id1 else id1):
            return stat
    return None

# Main function
def main():
    query = f"""SELECT ?item ?id1 ?id2 ?stat1 ?stat2 WHERE {{
  ?item p:{property} ?stat1. ?stat1 ps:{property} ?id1; wikibase:rank wikibase:NormalRank.
  ?item p:{property} ?stat2. ?stat2 ps:{property} ?id2; wikibase:rank wikibase:NormalRank.
  FILTER (?id1 < ?id2)
}}
OFFSET 0
"""
    print("SPARQL query...")
    entities = sparql(endpoint_wd, query)["results"]["bindings"]
    len_entities = len(entities)
    
    for i, entity in enumerate(entities):
        qid = entity["item"]["value"].split("/")[-1]
        print(f'{i}/{len_entities}: {qid}')
        id1 = entity["id1"]["value"]
        id2 = entity["id2"]["value"]
        stat1 = entity["stat1"]["value"].split("/")[-1]
        stat2 = entity["stat2"]["value"].split("/")[-1]
 
        for id, stat in ((id1, stat1), (id2, stat2)):
            response = requests.head(f"{url}{id}", headers=headers, allow_redirects=False)
            if response.status_code == 301 and response.headers.get("Location", "").split("/")[-1] == (id2 if id == id1 else id1):
                with open (f"{property}_redirects.txt", "a") as file:
                    file.write(f'{stat.replace("-", "$", 1)}' + "\n")
            elif response.status_code == 404:
                with open (f"{property}_404.txt", "a") as file:
                    file.write(f'{stat.replace("-", "$", 1)}' + "\n")
            else:
                with open (f"{property}_duplicates.txt", "a") as file:
                    file.write(f'{url}{id1} = {url}{id2}' + "\n")
                break

        time.sleep(15)  # Avoid being blocked
    
if __name__ == "__main__":
    main()

