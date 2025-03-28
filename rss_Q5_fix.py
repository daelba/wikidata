import feedparser
from endpoints import *
from rss_library import *
from urllib.parse import urlparse

query = '''SELECT ?item ?web ?rss ?stat WHERE { ?item wdt:P31 wd:Q5; wdt:P856 ?web; p:P1019 ?stat. ?stat ps:P1019 ?rss }'''
result = get_bigData(endpoint_wd, query, offset=0, max=100000)

for r in result:
    item = r["item"]["value"].split("/")[-1]
    rss = r["rss"]["value"]
    web = r["web"]["value"]
    statement = r["stat"]["value"].split("/")[-1].replace("-", "$", 1)
    
    rss_domain = urlparse(rss).netloc.lstrip("www.")
    web_domain = urlparse(web).netloc.lstrip("www.")

    if rss_domain != web_domain:
        print(f'{item}: RSS domain {rss_domain} does not match web domain {web_domain}. Skipping validation.')
        continue
    
    with open(f"rss_Q5_fix.txt", "a") as file:
        qs = (
            f'{item}|P856|"{web}"|P1019|"{rss}"',
            f'-STATEMENT|{statement} /* resolving constraint violation */'
            )
        file.write("\n".join(qs) + "\n")