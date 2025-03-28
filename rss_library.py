import feedparser

from http.client import RemoteDisconnected
import json
import requests

def validate_rss(url):
    try:
        # Attempt to parse as RSS
        feed = feedparser.parse(url)
        if feed.bozo == 0:
            return "RSS"
        elif feed.bozo != 0:
            if "document declared as us-ascii, but parsed as utf-8" in str(feed.bozo_exception):
                return "RSS"
            print(f"Parsing error for URL: {url}, Error: {feed.bozo_exception}")
        
        # If RSS parsing fails, attempt to parse as JSON
        response = requests.get(url)
        response.raise_for_status()
        try:
            json.loads(response.text)
            return "JSON"
        except json.JSONDecodeError:
            print(f"Error: URL does not contain valid RSS or JSON: {url}")
            return False
    except RemoteDisconnected:
        print(f"Error: Remote server closed the connection for URL: {url}")
        return "Error"
    except Exception as e:
        print(f"An error occurred while checking the feed: {e}")
        return "Error"
    return False

def check_response(url):
    try:
        response = requests.head(url)
        return response.status_code
    except Exception as e:
        #print(f"An error occurred while checking the status: {e}\n")
        return None
    
def is_feed_url_reachable(url):
    if not check_response(url):
        print(f"URL is not reachable: {url}")
        return False

    feed_type = validate_rss(url)
    if feed_type in ["RSS", "JSON"]:
        #print(f"URL is a reachable {feed_type} feed: {url}")
        return True
    else:
        print(f"URL is not a valid feed: {url}")
        return False