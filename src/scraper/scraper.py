import aiohttp
import asyncio
import json
import requests
from bs4 import BeautifulSoup

async def main():
    f = open("./tles.txt", "r")
    lines = [x for x in f]
    
    i = 0

    result = dict()
    async with aiohttp.ClientSession() as session:
        while i < len(lines):#len(lines):
            name = lines[i].strip()
            year = int(lines[i+1][9:11])

            if (year < 30):
                year = 2000 + year
            else:
                year = 1900 + year

            launch_number = lines[i+1][11:14]
            piece = lines[14][17]

            # print(name + ": " + str(year) + "-" + launch_number + piece)
            i += 3


            
            async with session.get("https://celestrak.org/satcat/{year}/{year}-{launch_number}.php#{piece}"\
                            .format(year=year, launch_number=launch_number, piece=piece)) as resp:
                text = await resp.text()
                desc = ""
                if "404" not in text:
                    soup = BeautifulSoup(text, "html.parser")
                    tags = soup.find_all()

                    tags = tags[7:-9]
                    names = [tag.name for tag in tags]
                    if 'blockquote' in names:
                        index = names.index('blockquote')
                        desc = tags[index].contents[0]
                    else:
                        for tag in tags:
                            if tag.name == 'p' \
                                and len(tag.find_all()) == 0 \
                                and len(tag.contents[0]) > len(desc):
                                desc = tag.contents[0]
                desc = desc.strip()
                result[name] = desc
                print("Queried satellite #{index}: w/ name {name}".format(index = (i // 3), name=name))
    
    with open("descriptions2.json", "w") as outfile:
        json.dump(result, outfile)
        

if  __name__ == "__main__":
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(main())