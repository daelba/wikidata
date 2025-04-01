import requests
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from endpoints import *
import time

def get_sparql_query(date):
    return f"""
    SELECT DISTINCT ?person ?personLabel WHERE {{
      ?person p:P569/psv:P569 [
        wikibase:timeValue "{date}"^^xsd:dateTime;
        wikibase:timePrecision 11
      ].
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }}
    }}
    """

def fetch_people_born_on_date(date):
    url = "https://query.wikidata.org/sparql"
    query = get_sparql_query(date)
    headers = {
        "Accept": "application/sparql-results+json",
        "User-Agent": "Q5 duplicates/1.0 (daniel.baranek@gmail.com)"
    }
    response = requests.get(url, params={'query': query}, headers=headers)
    response.raise_for_status()
    return response.json()['results']['bindings']

def check_similarity(name1, name2):
    return SequenceMatcher(None, name1, name2).ratio() * 100

def get_q_values(qid, prop):
    query = f"SELECT ?value WHERE {{ wd:{qid} p:{prop} ?stat. ?stat ps:{prop} ?value. MINUS {{ ?stat wikibase:rank wikibase:DeprecatedRank }} }}"
    return sparql(endpoint_wd, query)["results"]["bindings"]

year = 1930
start_date = datetime(year, 1, 1)
end_date = datetime(year + 9, 12, 31)
current_date = start_date

while current_date <= end_date:
    date_str = current_date.strftime('%Y-%m-%d')
    people = fetch_people_born_on_date(date_str)

    for i in range(len(people)):
        for j in range(i + 1, len(people)):
            name1 = people[i]['personLabel']['value']
            name2 = people[j]['personLabel']['value']
            similarity = check_similarity(name1, name2)
            if similarity > 95:
                died1 = get_q_values(people[i]['person']['value'].split("/")[-1], 'P570')
                died2 = get_q_values(people[j]['person']['value'].split("/")[-1], 'P570')
                if not (died1 and died2) or any(d1 in died2 for d1 in died1):
                    print(f"Date: {date_str}, Item IDs: [{people[i]['person']['value']} (died {died1[0]['value']['value'].split('T')[0] if died1 else '?'}), {people[j]['person']['value']} (died {died2[0]['value']['value'].split('T')[0] if died2 else '?'})], Similarity: {similarity}%")
    
    current_date += timedelta(days=1)
    time.sleep(2)