import requests
from datetime import datetime, timedelta
from difflib import SequenceMatcher

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

year = 1880
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
                print(f"Date: {date_str}, Item IDs: [{people[i]['person']['value']}, {people[j]['person']['value']}], Similarity: {similarity}%")
    
    current_date += timedelta(days=1)