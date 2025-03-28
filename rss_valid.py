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
        invalid_entry = f'-STATEMENT|{statement} /* RSS not reachable ({response}) + constraint violation (https://www.wikidata.org/wiki/Property:P1019#P2302) */'
        return f"{item}: The URL {url} is an invalid RSS feed.", invalid_entry

query = '''SELECT ?stat ?rss WHERE { ?item wdt:P31 wd:Q5; p:P1019 ?stat. ?stat ps:P1019 ?rss }'''

#query = '''SELECT ?stat ?rss WHERE { ?item p:P1019 ?stat. ?stat ps:P1019 ?rss. MINUS {?item wdt:P31 wd:Q5 } }'''
result = get_bigData(endpoint_wd, query, offset=0, max=100000)

with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
    futures = {executor.submit(process_url, res): res for res in result}
    valid_count = 0
    total_count = len(result)

    for i, future in enumerate(concurrent.futures.as_completed(futures), start=1):
        res = futures[future]
        try:
            message, invalid_entry = future.result()
            print(f"{i}/{total_count} {message}") #, end="\r")
            if invalid_entry:
                print(invalid_entry)
                with open(f"rss_invalid.txt", "a") as file:
                    file.write(invalid_entry + "\n")
        except Exception as e:
            print(f"Error processing URL {res['rss']['value']}: {e}")#, end="\r")