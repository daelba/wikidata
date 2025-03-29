import feedparser
from endpoints import *
from rss_library import *

import concurrent.futures

def process_url(res):
    url = res["rss"]["value"]
    statement = res["stat"]["value"].split("/")[-1].replace("-", "$", 1)
    item = res["stat"]["value"].split("/")[-1].split("-")[0]

    if not any(keyword in url.lower() for keyword in ["xml", "feed", "atom", "rss"]):
        return f"{item}: The URL {url} does not contain 'xml', 'feed', or 'atom'. Skipping validation.", False, None

    response = check_response(url)
    if response < 400:
        print(response)
        #invalid_entry = f'-STATEMENT|{statement} /* RSS not reachable ({response}) + constraint violation (https://www.wikidata.org/wiki/Property:P1019#P2302) */'
        invalid_entry = f'{statement}'
        return f"{item}: The URL {url} is an invalid RSS feed.", invalid_entry

errors = {
    "403": "Q1138586",
    "404": "Q1193907"
}
#query = '''SELECT ?stat ?rss WHERE { ?item wdt:P31 wd:Q5; p:P1019 ?stat. ?stat ps:P1019 ?rss }'''

query = '''SELECT ?stat ?rss WHERE {
    ?item p:P1019 ?stat.
    MINUS {?item wdt:P31 wd:Q5 }
    ?stat ps:P1019 ?rss; wikibase:rank wikibase:NormalRank.
}'''
result = get_bigData(endpoint_wd, query, offset=0, max=100000)

with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
    futures = {executor.submit(check_response, res["rss"]["value"]): res for res in result}
    valid_count = 0
    total_count = len(result)

    for i, future in enumerate(concurrent.futures.as_completed(futures), start=1):
        res = futures[future]
        try:
            response = future.result()
            #print(response)
            print(f"{i}/{total_count}", end="\r")
            if response and response > 399:
                statement = res["stat"]["value"].split("/")[-1].replace("-", "$", 1)
                with open(f"rss_invalid.txt", "a") as file:
                    file.write(f"{statement}|deprecated|{errors[str(response)]}" + "\n")
        except Exception as e:
            print(f"Error processing URL {res['rss']['value']}: {e}")#, end="\r")