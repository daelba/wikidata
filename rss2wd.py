import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import concurrent.futures

from endpoints import *
from rss_library import *

query = '''SELECT ?item ?web WHERE {
  ?item wdt:P31 wd:Q5;
        p:P856 ?statement.
  ?statement ps:P856 ?web.
  MINUS { ?statement pq:P1019 []}
}
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
    websites = get_bigData(endpoint_wd, query, offset=220000, limit=10000, max=300000)
    total = len(websites)
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        future_to_result = {executor.submit(find_rss_feed, result["web"]["value"]): result for result in websites}
        for i, future in enumerate(concurrent.futures.as_completed(future_to_result), start=1):
            result = future_to_result[future]
            qid = result["item"]["value"].split("/")[-1]
            print(f"{i}/{total}", end="\r")
            try:
                feeds = future.result()
                if feeds and len(feeds) == 1 and check_response < 400 and validate_rss(feeds[0]) in ["RSS", "JSON"]:
                    with open("rss.txt", "a") as file:
                        file.write(f'{qid}|P856|"{result["web"]["value"]}"|P1019|"{feeds[0]}"\n')
                #else:
                #    print(f"Item: {qid}, Website: {result["web"]["value"]}, RSS Feeds: {feeds}")
            except Exception as e:
                pass
                #print(f"Error fetching RSS for {result['web']['value']}: {e}")
    
if __name__ == "__main__":
    main()
