import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from endpoints import *

query = '''SELECT ?item ?web WHERE {
  ?item wdt:P31 wd:Q3918;
        wdt:P856 ?web.
 MINUS { ?item wdt:P1019 [] }
}
OFFSET 2700
'''


def find_rss_feed(url):
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException:
        return None

    soup = BeautifulSoup(response.content, 'html.parser')

    # Check for RSS feed link tags
    feed_links = [urljoin(url, link['href']) for link in soup.find_all('link', type='application/rss+xml', href=True) if not "/comments/" in link["href"]]
    if feed_links:
        return feed_links

    # Check for common RSS feed paths
    common_paths = ["/rss", "/feed", "/rss.xml", "/feed.xml", "/atom.xml"]
    feed_links = []
    for path in common_paths:
        try:
            if requests.head(urljoin(url, path)).status_code == 200:
                feed_links.append(urljoin(url, path))
        except requests.exceptions.RequestException:
            continue

    return feed_links if feed_links else None


def main():
    websites = sparql(endpoint_wd, query)["results"]["bindings"]
    for result in websites:
        qid = result["item"]["value"].split("/")[-1]
        feeds = find_rss_feed(result["web"]["value"])
        if feeds:
            if len(feeds) == 1:
                with open (f"rss.txt", "a") as file:
                    file.write(f'{qid}|P1019|"{feeds[0]}"' + "\n")
            else:
                print(f"Item: {qid}, Website: {result["web"]["value"]}, RSS Feeds: {feeds}")

if __name__ == "__main__":
    main()
