import sys
import time
from SPARQLWrapper import SPARQLWrapper, JSON

############### SPARQL funkce ###############

endpoint_wd = 'https://query.wikidata.org/sparql'
endpoint_wc = 'https://commons-query.wikimedia.org/sparql'

def sparql(endpoint, query):
	user_agent = "WDQS-example Python/%s.%s" % (sys.version_info[0], sys.version_info[1])
	sparql = SPARQLWrapper(endpoint, agent=user_agent)
	sparql.setQuery(query)
	sparql.setReturnFormat(JSON)
	while True:
		try:
			return sparql.query().convert()
		except Exception as error:
			print(error)
			print(f"\nDotaz na SPARQL endpoint {endpoint} se nezdařil. Opakuji...")
			time.sleep(5)
			continue
			
def get_bigData (endpoint, query, offset=0, limit=10000, max=None):
	items = []

	while True:
		print(f'Offset: {offset}')
		query_offset = query + f'''
		LIMIT {str(limit)}
		OFFSET ''' + str(offset)

		result = sparql(endpoint,query_offset)["results"]["bindings"]
		if len(result) != 0:
			items.extend(result)
			offset += limit
		else:
			print('Dohledáno ' + str(len(items)) + ' výsledků')
			return items

		if max and offset > max:
			return items
