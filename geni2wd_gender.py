from endpoints import *
from geni_library import *

# Get profile
def get_geni_gender(profile):
    data = geni_api(profile)
    if data and "gender" in data:
        return {"male": "Q6581097", "female": "Q6581072"}.get(data["gender"])
    
# Main function
def main():
    query = """SELECT DISTINCT ?person ?geni WHERE {
  ?person wdt:P2600 ?geni.
  MINUS { ?person wdt:P21 [] }
}
ORDER BY ?person
"""
    entities = sparql(endpoint_wd, query)["results"]["bindings"]
    len_entities = len(entities)
    
    for i, entity in enumerate(entities):
        qid = entity["person"]["value"].split("/")[-1]
        geni = entity["geni"]["value"]
        print(f'{i}/{len_entities}: {qid}')

        p21 = get_geni_gender(geni)
        if p21:
            with open (f"geni_P21.txt", "a") as file:
                file.write(f'{qid}|P21|{p21}|S248|Q2621214|S2600|"{geni}"|S813|{wd_timestamp()}' + "\n")

if __name__ == "__main__":
    main()