from endpoints import *
import pandas as pd
from urllib.parse import urlparse
import requests

def wd_dataframe(query):
    result = get_bigData(endpoint_wd, query, limit=10000)
    data = [
        {
            key: r[key]["value"].removeprefix("http://www.wikidata.org/entity/")
            for key in r
        }
        for r in result
    ]
    return pd.DataFrame(data)

def get_value(datavalue):
    if datavalue['type'] == 'string':
        return f"\"{datavalue['value']}\""
    elif datavalue['type'] == 'time':
        return f"{datavalue['value']['time']}/{datavalue['value']['precision']}"
    elif datavalue['type'] == 'wikibase-entityid':
        return f"{datavalue['value']['id']}"
    else:
        return f"{datavalue['value']}"

people_query = """SELECT DISTINCT * WHERE {
  ?person p:P856 ?s856;
        wdt:P31 wd:Q5.
  ?s856 ps:P856 ?personWWW;
        pq:P1019 ?rss.
}"""
people_df = wd_dataframe(people_query)
#people_df['domain'] = people_df['personWWW'].apply(lambda url: urlparse(url).netloc.removeprefix('www.'))
people_df['domain'] = people_df['personWWW'].apply(lambda url: '.'.join(urlparse(url).netloc.split('//')[-1].split('.')[-3:]))

print(people_df)

instit_query = """SELECT DISTINCT * WHERE {
  ?instit wdt:P856 ?institWWW;
          wdt:P31/wdt:P279+ wd:Q3918.
  MINUS { ?instit wdt:P31 wd:Q5 }
}"""
instit_df = wd_dataframe(instit_query)
#instit_df['domain'] = instit_df['institWWW'].apply(lambda url: urlparse(url).netloc.removeprefix('www.'))
instit_df['domain'] = instit_df['institWWW'].apply(lambda url: '.'.join(urlparse(url).netloc.split('//')[-1].split('.')[-3:]))
instit_df = instit_df[instit_df['domain'] != 'web.archive.org']
#instit_df = instit_df[instit_df['domain'] != 'archive.org']

print(instit_df)

merged_df = pd.merge(people_df, instit_df, on='domain', how='inner')
#merged_df = merged_df[merged_df.groupby('rss')['rss'].transform('count').ge(2)]

print(merged_df)

comment = " /* moving statement from P856 to P973: not a personal website, but an institution's page about a person */"
for index, row in merged_df.iterrows():
    person = row['person']
    s856 = row['s856'].removeprefix("statement/").replace("-","$",1)
    print(row['person'], s856, row['instit'])
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{person}.json"
    response = requests.get(url)
    response.raise_for_status()
    statement_json = response.json()
    s856_json = statement_json['entities'][person]['claims']['P856']
    for statement in s856_json:
        if statement['id'] == s856:
#            print(statement)
            mainstatement = f"{person}|P973|\"{statement['mainsnak']['datavalue']['value']}\""
            for qual in statement['qualifiers'].values():
                for q in qual:
                    if q['property'] != 'P1019':
                        mainstatement += f"|{q['property']}|" + get_value(q['datavalue'])
            references = []
            if 'references' in statement:
                for ref in statement['references']:
                    reference = ""
                    for snak in ref['snaks'].values():
                        for s in snak:
                            reference += f"|{s['property'].replace('P','S')}|" + get_value(s['datavalue'])
                    references.append(reference)
#            print(mainstatement)
#            print(references)
            
            qs = []
            if len(references) == 0:
                qs.append(mainstatement + comment)
            else:
                for ref in references:
                    qs.append(mainstatement + ref + comment)
            qs.append(f"-STATEMENT|{s856}" + comment)
            with open("check_official_web.txt", "a") as file:
                file.write("\n".join(qs) + "\n")
            break



