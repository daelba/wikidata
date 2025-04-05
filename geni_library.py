import requests
import time

# Get profile
def geni_api(profile):
    url = f"https://www.geni.com/api/profile-g{profile}"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "From": "baranek@hiu.cas.cz"
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        check_geni_limits(response.headers)
        return response.json()
    return None

def check_geni_limits(headers):
    limit = int(headers["X-API-Rate-Limit"])
    remaining = int(headers["X-API-Rate-Remaining"])
    window = int(headers["X-API-Rate-Window"])
    sleep = (limit-remaining)*limit/window
    if remaining < 3:
        time.sleep(window)
        print(f"Waiting {str(sleep)} seconds for Geni API rate limit ({headers['X-API-Rate-Remaining']}/{headers['X-API-Rate-Limit']}) to reset...")
    if sleep > 5:
        print(f"Waiting {str(sleep)} seconds for Geni API rate limit ({headers['X-API-Rate-Remaining']}/{headers['X-API-Rate-Limit']}) to reset...")
    time.sleep(sleep)

def wd_timestamp():
    return time.strftime("+%Y-%m-%dT00:00:00Z/11", time.gmtime())