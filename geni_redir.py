import requests
import time

from endpoints import *

headers = {"User-Agent": "Mozilla/5.0"}
prefix = "https://www.geni.com/profile/index/"

def check_redirects(g1, g2, stat1, stat2):
    for g, stat in ((g1, stat1), (g2, stat2)):
        response = requests.head(f"{prefix}{g}", headers=headers, allow_redirects=False)
        if response.status_code == 301 and response.headers.get("Location", "").split("/")[-1] == (g2 if g == g1 else g1):
            return stat
    return None

# Main function
def main():
    query = """SELECT ?item ?geni1 ?geni2 ?stat1 ?stat2 WHERE {
  ?item p:P2600 ?stat1. ?stat1 ps:P2600 ?geni1; wikibase:rank wikibase:NormalRank.
  ?item p:P2600 ?stat2. ?stat2 ps:P2600 ?geni2; wikibase:rank wikibase:NormalRank.
  FILTER (?geni1 < ?geni2)
}
OFFSET 450
"""
    print("SPARQL query...")
    entities = sparql(endpoint_wd, query)["results"]["bindings"]
    len_entities = len(entities)
    
    for i, entity in enumerate(entities):
        qid = entity["item"]["value"].split("/")[-1]
        print(f'{i}/{len_entities}: {qid}')
        g1 = entity["geni1"]["value"]
        g2 = entity["geni2"]["value"]
        stat1 = entity["stat1"]["value"].split("/")[-1]
        stat2 = entity["stat2"]["value"].split("/")[-1]
 
        for g, stat in ((g1, stat1), (g2, stat2)):
            response = requests.head(f"{prefix}{g}", headers=headers, allow_redirects=False)
            if response.status_code == 301 and response.headers.get("Location", "").split("/")[-1] == (g2 if g == g1 else g1):
                with open (f"geni_redirects.txt", "a") as file:
                    file.write(f'{stat.replace("-", "$", 1)}' + "\n")
            elif response.status_code == 404:
                with open (f"geni_404.txt", "a") as file:
                    file.write(f'{stat.replace("-", "$", 1)}' + "\n")
            else:
                with open (f"geni_duplicates.txt", "a") as file:
                    file.write(f'{prefix}{g1} = {prefix}{g2}' + "\n")
                break

        time.sleep(15)  # Avoid being blocked
    
if __name__ == "__main__":
    main()

