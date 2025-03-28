import requests
import time

from endpoints import *

headers = {"User-Agent": "Mozilla/5.0"}

def check_redirects(g1, g2, stat1, stat2):
    response = requests.get(f"https://www.geni.com/profile/index/{g1}", headers=headers, allow_redirects=False)
    if response.status_code == 301 and response.headers["Location"].split("/")[-1] == g2:
        return stat1

    response = requests.get(f"https://www.geni.com/profile/index/{g2}", headers=headers, allow_redirects=False)
    if response.status_code == 301 and response.headers["Location"].split("/")[-1] == g1:
        return stat2
    
    return

# Main function
def main():
    query = """SELECT ?item ?geni1 ?geni2 ?stat1 ?stat2 WHERE {
  ?item p:P2600 ?stat1. ?stat1 ps:P2600 ?geni1; wikibase:rank wikibase:NormalRank.
  ?item p:P2600 ?stat2. ?stat2 ps:P2600 ?geni2; wikibase:rank wikibase:NormalRank.
  FILTER (?geni1 < ?geni2)
}
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
 
        id_redir = check_redirects(g1, g2, stat1, stat2)
        if id_redir:
            with open (f"geni_redirects.txt", "a") as file:
                file.write(f'{id_redir.replace("-", "$", 1)}' + "\n")
        else:
            with open (f"geni_duplicates.txt", "a") as file:
                file.write(f'https://www.geni.com/profile/index/{g1} = https://www.geni.com/profile/index/{g2}"' + "\n")

        time.sleep(15)  # Avoid being blocked
    
if __name__ == "__main__":
    main()

