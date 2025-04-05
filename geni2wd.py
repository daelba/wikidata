import requests
from bs4 import BeautifulSoup
import time

from endpoints import *
from geni_library import *

# Search for a person on Geni.com
def search_geni(name, narkdy, zemkdy):
    time.sleep(1)
    dob = narkdy[:4] if narkdy else None
    dod = zemkdy[:4] if zemkdy and zemkdy[:4].isdigit() else None
    search_url = f"https://www.geni.com/search?search_advanced=open&names={name.replace(' ', '+')}&birth[year_range]=exact&birth[year]={dob[:4]}"    
    #print(search_url)
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(search_url, headers=headers)
    
    if response.status_code != 200:
        return None, None
    
    soup = BeautifulSoup(response.text, "html.parser")
    profiles = []
    
    for result in soup.select(".search-results-table tr.profile-layout-grid"):
        profile_link_elem = result.select("span.privacy-icon-public")
        if not profile_link_elem:
            continue
        profile_link = profile_link_elem[0]["id"].replace("shared_icon_",'')
        profile_dates_elem = result.select("div.small.quiet")
        if not profile_dates_elem:
            continue
        profile_dob = profile_dates_elem[0].text.strip().replace(" ","")[1:5]
        profile_dod = profile_dates_elem[0].text.strip().replace(" ","")[6:10] # if len(profile_dates_elem[0].text) > 7 else None
        profile_dob = profile_dob if profile_dob.isdigit() else None
        profile_dod = profile_dod if profile_dod.isdigit() else None
        
        #print("\n",dob,profile_dob,dod,profile_dod,"\n")
        #print(profile_link, profile_dob, profile_dod)
        if dob == profile_dob and (
            dod == profile_dod or (not dod and (not profile_dod or int(profile_dod) > 1939))
            ):
            checked_narkdy_profile = check_geni_profile(profile_link, narkdy)
            if checked_narkdy_profile:
                print(profile)
                return [checked_narkdy_profile], "checked"
            profiles.append(profile_link)
            
    return profiles, "unchecked" if profiles else None

# Check profile
def check_geni_profile(profile, input_birthdate):
    data = geni_api(profile)
    if "birth" in data and "date" in data["birth"]:
        bd = data["birth"]["date"]
        if "year" in bd:
            geni_birthdate = f"{bd['year']}"
            if "month" in bd:
                geni_birthdate += f"-{bd['month']:02d}"
                if "day" in bd:
                    geni_birthdate += f"-{bd['day']:02d}"
            if input_birthdate == geni_birthdate:
                return profile
    return None
    
# Main function
def main():
    property = sys.argv[1] if len(sys.argv) > 1 else None
    if property is None:
        print("Error: first argument must be a property ID", file=sys.stderr)
        sys.exit(1)

    query = f"""SELECT DISTINCT ?person WHERE {{
  ?person wdt:{property} [].
  MINUS {{ ?person wdt:P2600 [] }}
}}
ORDER BY ?person
"""
    entities = get_bigData(endpoint_wd, query, offset=0, limit=100000)
    matches = {}
    len_entities = len(entities)
    
    for i, entity in enumerate(entities):
        qid = entity["person"]["value"].split("/")[-1]
        print(f'{i}/{len_entities}: {qid}')

        personQuery = f"""SELECT DISTINCT ?personLabel ?narkdy ?zemkdy ?prec569 ?prec570 WHERE {{
  wd:{qid} rdfs:label ?label;
    p:P569/psv:P569 [
      wikibase:timeValue ?narkdy;
      wikibase:timePrecision ?prec569
    ].
  OPTIONAL {{ wd:{qid} p:P570/psv:P570 [ wikibase:timeValue ?zemkdy; wikibase:timePrecision ?prec570 ] }}
  BIND(STR(?label) AS ?personLabel)
}}
"""
        personResult = sparql (endpoint_wd, personQuery)["results"]["bindings"]
        for result in personResult:
            name = result["personLabel"]["value"]
            narkdy = result["narkdy"]["value"][:10] if "narkdy" in result and int(result["prec569"]["value"]) > 8 else None
            zemkdy = result["zemkdy"]["value"][:10] if "zemkdy" in result and int(result["prec570"]["value"]) > 8 else None
            print(name, narkdy, zemkdy)
            if not narkdy:
                continue
            dob = narkdy[:4] if narkdy else None
            #dod = zemkdy[:4] if zemkdy else None
            #print(f"Searching for: {name} ({dob})")
            geni_profiles, profile_status = search_geni(name, narkdy, zemkdy)
            
            if geni_profiles:
                #matches[qid] = {
                #    "wikidata_name": name,
                #    "dob": dob,
                #    "geni_matches": geni_profiles
                #}
            
                if len(geni_profiles) == 1:
                    with open (f"geni_{profile_status}.txt", "a") as file:
                        file.write(f'{qid}|P2600|"{geni_profiles[0]}"' + "\n")
                    break
    
    #for qid, data in matches.items():
    #    print(f"\nWikidata {qid}: {data['wikidata_name']} ({data['dob']})")
    #    for profile in data["geni_matches"]:
    #        print(f"  - https://www.geni.com/profile/index/{profile}")

if __name__ == "__main__":
    main()

