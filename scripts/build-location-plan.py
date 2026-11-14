"""Rebuild the approximate NZ-time position plan from the existing itinerary.

These times drive an illustration, not a record of actual movements. Run this
after changing trip dates, road legs or overnight stops.
"""
from copy import deepcopy
from datetime import date, timedelta
from math import cos, hypot, radians
from pathlib import Path
import json
import re

from lxml import html

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "trips/2026-11-nz-rundtur.html"
source = PAGE.read_text()
document = html.fromstring(source)
match = re.search(r'(<script\b[^>]*\bid="rk-data"[^>]*>)(.*?)(</script>)', source, re.S)
data = json.loads(match[2])

coastal = {0, 6, 8, 9, 10, 12, 13, 16, 17, 19, 20, 21, 22}
for index, base in enumerate(data["bases"]):
    base["camp"] = index not in {11, 18}
    base["coastal"] = index in coastal

activities = {
    "s-airport": ("airport", 50), "s-cheviot-pies": ("food", 45),
    "s-mangamaunu": ("beach", 90), "s-kaikoura-whales": ("vista", 60),
    "s2": ("hike", 180), "s47": ("hike", 45),
    "s48": ("hike", 60), "s41": ("walk", 25), "s42": ("waterfall", 60),
    "s49": ("vista", 20), "s50": ("waterfall", 30), "s45": ("hike", 60),
    "s59": ("hike", 480), "s6": ("hike", 360), "s51": ("walk", 45),
    "s52": ("hike", 40), "s53": ("vista", 40), "s54": ("walk", 45),
    "s8": ("hike", 75), "s9": ("beach", 60), "s46": ("cave", 100),
    "s44": ("vista", 30), "s43": ("beach", 60), "s10": ("city", 90),
    "s58": ("hike", 210), "s11": ("hike", 60), "s63": ("waterfall", 50),
    "s12": ("city", 60), "s64": ("hike", 60), "s14": ("drive", 0),
    "s65": ("city", 30), "s66": ("drive", 0), "s67": ("waterfall", 60),
    "s68": ("vista", 25), "s15": ("hike", 480), "s16": ("waterfall", 120),
    "s17": ("walk", 45), "s18": ("waterfall", 45), "s20": ("swim", 45),
    "s21": ("hike", 120), "s22": ("city", 60), "s23": ("hike", 60),
    "s24": ("cave", 120), "s25": ("cave", 45), "s26": ("beach", 60),
    "s27": ("surf", 120), "s28": ("hike", 150), "s29": ("swim", 90),
    "s30": ("hike", 45), "s31": ("vista", 45), "s32": ("hike", 240),
    "s33": ("beach", 90), "s39": ("city", 45),
}
spots = {}
for spot in data["spots"]:
    anchors = re.findall(r'href="#([^\"]+)"', spot["html"])
    anchor = anchors[-1] if anchors else ""
    activity, duration = activities.get(anchor, ("hike", 90))
    spot["activity"] = activity
    spot["anchor"] = anchor
    spots[anchor] = dict(spot, duration=duration)

data["activityTargets"] = [
    {"name": "Manu Bay · muligt surfbesøg", "ll": [-37.822076, 174.817446], "activity": "surf"}
]
data["helenaFlight"] = {
    "home": [-27.4698, 153.0251], "from": [-27.3842, 153.1175], "to": [-43.48916, 172.53978],
    "departure": "2026-11-17T11:40:00+10:00", "arrival": "2026-11-17T18:10:00+13:00",
    "estimatedDeparture": True,
    "note": "Afgangen og flyets position er anslået ud fra 3½ timers direkte flyvning. Kun ankomsten kl. 18.10 er oplyst. Ikke flytracking."
}

stay_indexes = [0, 20, 19, 1, 2, 3, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 12, 13, 13, 14, 14, 15, 16, 17, 17, 18]
leg_for_day = {0: 0, 1: 22, 2: 23, 4: 2, 5: 3, 6: 4, 7: 5, 9: 7, 11: 8, 12: 9, 14: 10,
               15: 11, 18: 14, 19: 15, 20: 16, 21: 17, 23: 18, 24: 19, 25: 20, 27: 21}
calendar = document.xpath('//*[@data-calendar-day]')
days = []

def stay(index):
    b = data["bases"][index]
    return {key: deepcopy(b[key]) for key in ("name", "ll", "camp", "coastal")}

def progress_at(points, target):
    lengths = [0.0]
    for a, b in zip(points, points[1:]):
        lengths.append(lengths[-1] + hypot((b[0] - a[0]), (b[1] - a[1]) * cos(radians(a[0]))))
    nearest = min(range(len(points)), key=lambda i: hypot(points[i][0] - target[0], (points[i][1] - target[1]) * cos(radians(target[0]))))
    return lengths[nearest] / (lengths[-1] or 1)

def drive_minutes(label):
    hours, minutes = map(int, re.match(r'(\d+) t (\d+)', label).groups())
    return hours * 60 + minutes

def road_day(index, leg_index, selected, start=540):
    leg = data["legs"][leg_index]
    driving = drive_minutes(leg["label"]) * 1.1
    selected = [(progress_at(leg["pts"], s["ll"]), s) for s in selected if s["activity"] != "drive"]
    selected.sort(key=lambda item: item[0])
    now, previous, segments = start, 0.0, []
    for progress, spot in selected:
        duration = max(3, round(driving * (progress - previous)))
        if progress > previous:
            segments.append({"from": now, "to": now + duration, "leg": leg_index,
                             "portion": [previous, progress], "name": "på vej mod " + spot["name"]})
            now += duration
        segments.append({"from": now, "to": now + spot["duration"], "point": spot["ll"],
                         "activity": spot["activity"], "name": spot["name"]})
        now += spot["duration"]
        previous = progress
    duration = max(3, round(driving * (1 - previous)))
    segments.append({"from": now, "to": now + duration, "leg": leg_index,
                     "portion": [previous, 1], "name": "på vej mod " + days[index]["stay"]["name"]})
    return segments

for index, link in enumerate(calendar):
    stamp = (date(2026, 11, 14) + timedelta(days=index)).isoformat()
    assert link.find("time").get("datetime") == stamp
    days.append({"date": stamp, "stay": stay(stay_indexes[index]), "segments": []})
    if index == 13:
        days[-1]["uncertain"] = True
        days[-1]["note"] = "Dagens overnatningssted er ikke endeligt valgt. Her vises det senest fastlagte sted."

for index, leg_index in leg_for_day.items():
    article = document.get_element_by_id(calendar[index].get("data-calendar-day"))
    selected = []
    for card in article.xpath('.//article[@class="spot"]'):
        anchor = card.get("id", "")
        if anchor not in spots or card.xpath('ancestor::details[@id="dag22"]'):
            continue
        if spots[anchor].get("st") in {"out", "maybe", "after"}:
            continue
        selected.append(spots[anchor])
    if index == 14:
        selected = [spots[a] for a in ("s46", "s44", "s43")]
    start = 420 if index in {0, 4} else 600 if index == 1 else 540
    days[index]["segments"] = road_day(index, leg_index, selected, start)

def solo_day(index, start):
    base = days[index]["stay"]
    parts = [(start, 720, "work", base["ll"], "arbejder ved bilen"),
             (720, 780, "food", base["ll"], "spiser frokost"),
             (780, 900, "camp" if index == 1 else "walk", base["ll"],
              "slår tagteltet op og slapper af" if index == 1 else "går en tur"),
             (900, 1020, "work", base["ll"], "arbejder ved bilen"),
             (1080, 1140, "food", base["ll"], "spiser aftensmad"),
             (1140, 1320, "beer", base["ll"], "hygger i campingstolen")]
    days[index]["segments"] += [{"from": max(a, start), "to": b, "point": ll, "activity": activity,
                                 "name": base["name"].split(" · ")[0] + " · " + name}
                                for a, b, activity, ll, name in parts if b > max(a, start)
                                and not (index == 1 and b == 780)]
    days[index]["note"] = "Arbejde, mad og aftenhygge er illustreret efter et anslået dagsforløb, ikke live aktivitetsdata."

solo_day(0, max(555, days[0]["segments"][-1]["to"]))
solo_day(1, max(630, days[1]["segments"][-1]["to"]))
solo_day(2, max(840, days[2]["segments"][-1]["to"]))
days[1]["note"] = "Pies hos Harris Farms, derefter Mangamaunu og booket A1 Kaikoura. Surf kun ved gode bølger og andre surfere i vandet; kortet viser en anslået kystpause og bekræfter ikke, at Karsten surfer. Øvrige aktiviteter og tider er illustreret."
days[2]["note"] = "Et anslået forsøg på at spotte hvaler fra Point Kean før Godley Head. Hvalerne på kortet er illustrationer, ikke observationer. Ophold og tider er anslået."

# The arrival evening and ferry have their own known/assumed time windows.
airport = spots["s-airport"]["ll"]
airport_progress = progress_at(data["legs"][1]["pts"], airport)
days[3]["segments"] = [
    {"from": 480, "to": 540, "point": data["bases"][19]["ll"], "activity": "food", "name": "Godley Head · morgenmad"},
    {"from": 540, "to": 600, "point": data["bases"][19]["ll"], "activity": "packing", "name": "Godley Head · pakker sammen før check-out kl. 10"},
    {"from": 600, "to": 640, "leg": 1, "portion": [0, airport_progress * .25], "name": "på vej mod Christchurch"},
    {"from": 640, "to": 960, "point": data["legs"][1]["pts"][max(1, len(data["legs"][1]["pts"]) // 10)], "activity": "work", "name": "Christchurch · arbejde og frokost før afhentning"},
    {"from": 960, "to": 1035, "leg": 1, "portion": [airport_progress * .25, airport_progress], "name": "på vej til Christchurch lufthavn"},
    {"from": 1035, "to": 1140, "point": airport, "activity": "airport", "name": "Henter Helena i Christchurch kl. 18.10"},
    {"from": 1140, "to": 1290, "leg": 1, "portion": [airport_progress, 1], "name": "på vej til Route79"},
]
days[8]["segments"] = [
    {"from": 480, "to": 495, "leg": 6, "portion": [0, .5], "name": "på vej til Alex Knob"},
    {"from": 495, "to": 975, "point": spots["s59"]["ll"], "activity": "hike", "name": "Alex Knob"},
    {"from": 975, "to": 990, "leg": 6, "portion": [.5, 1], "name": "tilbage til Otto/MacDonalds"},
]
days[17]["segments"] = [
    {"from": 285, "to": 365, "leg": 12, "name": "på vej til færgen i Picton"},
    {"from": 365, "to": 465, "point": data["legs"][12]["pts"][-1], "activity": "walk", "name": "Picton · venter på færgen"},
    {"from": 465, "to": 675, "ferry": 0, "activity": "ferry", "name": "Picton → Wellington"},
    {"from": 690, "to": 700, "leg": 13, "name": "på vej til Wellington"},
    {"from": 780, "to": 960, "point": spots["s10"]["ll"], "activity": "city", "name": "Wellington"},
]
days[17]["note"] = "Færgen er ombooket og bekræftet til tir 1 dec kl. 07.45, Picton → Wellington. Sejltiden på cirka 3½ timer og ankomsttiden er anslået. Terminal og check-in-frist følger den nye billet."
days[22]["segments"] = [{"from": 450, "to": 930, "point": spots["s15"]["ll"], "activity": "hike", "name": "Tongariro Alpine Crossing"}]
manu = data["activityTargets"][0]
days[26]["segments"] = [{"from": 600, "to": 810, "point": manu["ll"], "activity": "surf", "name": "Muligt surfbesøg · Manu Bay"}]
days[26]["note"] = "Surfbesøget er en mulighed i planen. Scenen viser et skøn og bekræfter ikke, at de faktisk surfer."

data["locationPlan"] = {
    "timeZone": "Pacific/Auckland", "version": 1,
    "start": {"name": "South New Brighton", "ll": [-43.53016, 172.73651], "camp": False, "coastal": True},
    "days": days,
    "assumptions": "Dagstider, pauser og aktiviteternes varighed er anslået. Seneste faste sted bruges ved åbne valg."
}
source = source[:match.start(2)] + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + source[match.end(2):]
PAGE.write_text(source)
print(f"Built {len(days)} approximate NZ-time days and Helena's estimated Brisbane flight.")
