from serpapi import GoogleSearch
from urllib.parse import urlparse, parse_qs
import requests
import os
from http.cookiejar import Cookie
from dotenv import load_dotenv
import json

from endpoints import *

load_dotenv()
wcqc = os.environ['WCQC_AUTH_TOKEN']
api1 = os.environ['LENS_API_1']
api2 = os.environ['LENS_API_2']

logfile = "wikimedia_commons.log"

def init_session(endpoint, token):
    domain = urlparse(endpoint).netloc
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'daelba/1.0',
    })
    session.cookies.set_cookie(Cookie(0, 'wcqsOauth', token, None, False, domain, False, False, '/', True,
        False, None, True, None, None, {}))
    return session

def main():
	API_limit = 100

	query = '''SELECT ?item ?image WHERE {
 ?item (wdt:P50|wdt:P170) wd:Q61685639;
       schema:contentUrl ?image.
}'''

	session = init_session(endpoint_wc, os.environ['WCQS_AUTH_TOKEN'])
	response = session.post(
		url=endpoint_wc,
		data={'query': query},
		headers={'Accept': 'application/json', "User-Agent": "check-uploads/1.0 (daniel.baranek@gmail.com)"}
	)
	response.raise_for_status()
	uploaded_files = response.json()["results"]["bindings"]
	
	for file in uploaded_files:
		with open (logfile,"r") as log:
			log_last = log.readlines()[0].strip()
		item = file["item"]["value"]
		print(item, log_last, API_limit)
		if item > log_last and API_limit > 0:
			API_limit = API_limit - 1
			print(item)
			params = {
				"engine": "google_lens",
				"url": file["image"]["value"],
				"api_key": api2
				}
			search = GoogleSearch(params)
			results = search.get_dict()
			print(results)
			if "visual_matches" in results:
				vms = [vm for vm in results["visual_matches"] if "wikimedia.org" not in urlparse(vm["image"]).netloc]
				file["visual_matches"] = vms
    
			with open("commons_files.json", "w") as outfile:
				json.dump(uploaded_files, outfile)


		else:
			print("Dosaženo limitu API")

if __name__ == "__main__":
	main()
