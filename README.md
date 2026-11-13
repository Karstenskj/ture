# Ture

Statisk side med rejseplaner. Ingen build, ingen afhængigheder, ingen npm. Ren HTML og CSS, som ligger direkte på GitHub Pages.

**Live:** https://karstenskj.github.io/ture/

## Filer

```
index.html              forsiden med menuen over alle ture
assets/style.css        hele designsystemet, deles af alle sider
assets/map.js           zoom og træk på inline SVG-kort
assets/forecast.js      vejr og bølger fra Open-Meteo, hentes hver gang siden åbnes
assets/rutekort.js      rigtigt kort (Leaflet + OpenStreetMap) med ruten og et ark der glider op ved tryk
trips/ÅÅÅÅ-MM-sted.html én fil pr. tur
.nojekyll               så GitHub Pages ikke kører Jekyll
```

## Faste rammer for NZ-rundturen 2026

**Datoer og bookinger opdateret 14 nov:** Brugeren har valgt at rykke alle etaper fra den oprindelige start man 16 nov én dag frem og forkorte Motutere Bay til én overnatning. Helena lander tir 17 nov kl. 18.10 i Christchurch. Første rundturnat er Route79 tir 17 nov. Motutere Bay har én nat man 7 dec, afrejse tir 8 dec. Marokopa tir 8 dec, Raglan ons 9 dec–tor 10 dec og Auckland fre 11 dec er uændrede. Der er 24 rundturnætter. Før turen ligger én nat ved Hurunui River Mouth lør 14 nov og to nætter i tagteltet ved Kaikōura søn 15 nov–man 16 nov. Den konkrete Kaikōura-campingplads og pris er ikke valgt. I alt 27 nætter i kalenderen.

**Start og afhentning:** Karsten starter køreturen fra South New Brighton i Christchurch lør 14 nov om morgenen og kører til Hurunui River Mouth Reserve Camping Ground, cirka 120 km/1 t 47 fra området. Efter brugerens valg viser den offentlige side kun et omtrentligt startpunkt i South New Brighton og den tidligere rute fra området; den private adresse og rutens præcise første stykke publiceres ikke. Første køreetape er med i kortets `legs` og den samlede kørsel. Hent Helena i Christchurch lufthavn tir 17 nov kl. 18.10; stoppet har sit eget kortpunkt og programanker `s-airport`. Bevar de øvrige steders numre og ankre. Lufthavnsfoto: CHCBOY, Wikimedia Commons, CC BY-SA 4.0.

**Færge:** Rejseplanen har Picton→Wellington tir 1 dec. Den eksisterende billet er stadig booket man 30 nov kl. 07.45 med check-in senest kl. 06.45 og skal ombookes. En ny dato, afgangstid eller check-in er ikke bekræftet. Kl. 04.45 fra Mistletoe Bay gælder kun, hvis den nye færge også afgår kl. 07.45. Bekræft tider, terminal og tidlig biludkørsel/eventuel bom med pladsen efter ombooking. Færgeselskab og terminal følger billetten; de er ikke oplyst i chatten. Markér ikke den nye dato som booket uden bekræftelse.

Hurunui River Mouth Reserve Camping Ground erstatter Gore Bay natten 14.–15. november. Kommunens pris er NZ$10 pr. plads uden strøm, betaling i honesty box, ingen reservation. Basale toiletter, ingen strøm. `c-gore` bevares som gammelt anker, men viser nu Hurunui. Kaikōura er fortsat planlagt 15.–17. november; præcis plads og pris er ikke valgt.

Route79 17.–18., Lake Pearson 19.–20., Hans Bay 20.–21. og Otto/MacDonalds 21.–23. november er booket ifølge brugeren. Punakaiki fra 23. november er ikke booket. Lake Poaka 18.–19. november erstatter Glentanner; pladsen er gratis og uden reservation. Mount Cook-besøgene er bevaret. Kørsel 18. november: cirka 276 km/4 t 01 inklusive Hooker/Sealy- og Tasman-parkeringspladserne, derefter Lake Poaka. Den 19.: cirka 298 km/4 t 03 via Castle Hill til Lake Pearson.

### Bookingstatus ét sted

Redigér kun `trips/2026-11-nz-bookings.js`, når et ophold bliver booket. Hver nøgle er campingkortets eksisterende anker; `base` er campingpladsens indeks i `rk-data.bases`, `from` er ankomst, og `until` er afrejse (eksklusiv). `task` er opgavens `data-k`. Tilføj kun `total` og `adults`, når den faktiske pris er oplyst; offentliggør aldrig bookingnumre eller kvitteringer. `assets/bookings.js` viser automatisk Booket i program, kalender og kort samt låser den bekræftede bookingopgave. Ingen build eller netværkskald kræves. Datoerne forhindrer, at en delvist booket fler-nætters plads får alle nætter markeret. Gratis pladser står som gratis, ikke booket.

Eksempel på en fremtidig bekræftet booking:

```js
'camp-anker': { base: 6, from: '2026-11-23', until: '2026-11-25', task: 'opgavens-data-k' }
```

Ved ændrede overnatningssteder eller ruter køres `python3 scripts/build-location-plan.py` for at opdatere familiens omtrentlige position.

Hans Bay ved Lake Kaniere er valgt fre 20 nov efter Lake Pearson tor 19 nov. Dorothy Falls og Hokitika Gorge besøges lør 21 nov før Franz Josef. Otto/MacDonalds Campsite ved Lake Mapourika har to nætter lør 21 nov–søn 22 nov, afrejse man 23 nov. Alex Knob er den planlagte vandring søn 22 nov: 17,2 km og cirka 8 timer retur, kun i egnede vejrforhold. Roberts Point er et gråt alternativ, ikke en ekstra vandring samme dag. Behold Alex Knobs Instagram-rating og direkte citat. Kør til Alex Knob Carpark på Glacier Access Road (-43.4123524,170.1770400), cirka 31 km/30 min tur-retur fra Otto. Tjek parkeringsskiltningen; afsæt eventuelt $20 NZD. Campingen koster $36 for to pr. nat; parkeringsafgiften ved vandringen er separat. Campingpladsernes ledighed skal kontrolleres for de nye datoer.

Brunner Mine besøges man 23 nov før Punakaiki (to nætter man 23 nov–tir 24 nov). Kerr Bay/evt. Angelus er ons 25 nov; The Barn tor 26 nov og Wharariki lør 28 nov med den ekstra nat fre 27 nov valgfrit mellem de to. Begge har vaskemaskine; vask tøj dér, hvor de tager to nætter.

Mistletoe Bay har to nætter søn 29 nov–man 30 nov. Mount Stokes er kun en mulig krævende tur man 30 nov; Onahau Point, Peninsula Track eller kajak er alternativer. Adgang og aktuelle Kenepuru Road-forhold skal kontrolleres. Whatamango er fravalgt. Escarpment er ons 2 dec; Opunake tor 3 dec–fre 4 dec; Forgotten World Highway og Mangahuia lør 5 dec; Tongariro Crossing søn 6 dec; Taupō/Motutere Bay man 7 dec (én nat); Marokopa tir 8 dec; Raglan ons 9 dec–tor 10 dec; Auckland fre 11 dec.

Den ekstra Taupō/Rotorua-dag og dens 248 km/4 t 30 er fjernet fra den fastlagte rute. Steder, billeder og kortlink er bevaret som mulige udflugter, og udflugtsruten ligger blandt kortets ekstrature. Den fastlagte rute er cirka 3 900 km/62 timer. De 24 rundturnætter koster cirka $811–836 for de kendte priser, $74 mindre efter skiftet til gratis Lake Poaka; Wellington og to Opunake-nætter mangler pris. Kaikōuras to nætter mangler pris og er ikke med i beløbet.

Napier og hele East Cape-runden via Gisborne er fjernet efter brugerens ønske, inklusive ekstra kørespor, kortpunkt, stedkort og forslagsrækker. De øvrige fastlagte nætter er uændrede. Siden åbner som standard med satellitkort i CSS-fuldskærm og automatisk GPS; browseren skal have tilladelse til lokalitet. GPS-positionen opdateres løbende uden at flytte kortet efter første centrering. Direkte links til Program og andre faner bevares. Når fuld skærm lukkes, vises kun datolinjen, nøgletallene og kortet; introduktion og datoændringsforklaring er fjernet fra toppen. Zoom er glidende med brøkdele af zoomniveauer og uden heltalssnap. Knapperne zoomer et halvt niveau pr. tryk, og hjul/trackpad følger input løbende med hurtigere respons. Program beholder dagsdetaljerne. Hovedruten er grøn; alle ture efter Auckland, inklusive Northland, er orange. Campsites og overnatninger er lilla, øvrige stop er blå, og fravalgte steder er grå. I kortets overblik vises nætterne som prikker; datoerne kommer frem ved indzoomning. GPS-markøren er `assets/honda-accord-tourer-cw2.svg`: en blå Honda Accord Tourer CW2 set oppefra med pakket tagtelt og gult surfboard. Positionen er centreret på bilikonet. Brugeren annullerede ønsket om en ekstra rød færgepåmindelse; den eksisterende påmindelse er bevaret.

NZ-programmet vises som en kalender fra mandag til søndag med ét dagsprogram åbent ad gangen. Fanerne Nætter, Pladser og Steder er fjernet: camping- og stedkort er flyttet ind under Program, og stedernes eksisterende ankre åbner automatisk den rette dag og dens detaljer. Steder uden fast dag og Instagram-forslag ligger i Program under mulige ture. Bevar billeder, ratings, citater og kortlinks ved fremtidige ændringer.

Mobilkortet bruger hele bredden i Kort-fanen og kan åbnes i CSS-baseret fuld skærm, også på iPhone. Bevar viewport-fit=cover, safe-area-kanter, én-finger-navigation i kortfanen og muligheden for at gå til Program fra fuld skærm. På mobil vises campingprikker i overblikket; datoer og navne kommer frem ved indzoomning. Forklaringen åbnes med en knap, og stedkort kan udvides.

Valgte ekstra stop på Nordøen: Escarpment Track ons 2 dec (med returtransport mellem stationerne), Dawson Falls med Wilkies Pools tor 3 dec, Lake Mangamahoe som udflugt fra Opunake fre 4 dec samt Whangamōmona, Moki Tunnel, Mount Damper Falls og Tāngarākau Gorge lør 5 dec. Kørsel og vandfaldsafstikker er medregnet; den 5. december er en hel udflugtsdag. Rotokare og Zealandia er fravalgt. Hvert af de syv valgte stedkort har tre fotos.

Heldagen i Raglan tor 10 dec har et muligt surfbesøg ved Manu Bay. Axel og de andre anbefalede stedet og sagde, at surfen var bedre end ved stranden tæt på Te Kopua-campen. Besøget er en overvejelse, ikke en fast køreetape.

## Karsten og Helenas verden

`assets/route-position.js` beregner ca. position og aktivitet ud fra `locationPlan` i turens JSON. `scripts/build-location-plan.py` genbygger planen efter ændringer i datoer, nætter eller kørselsruter. Alle NZ-tider bruger Pacific/Auckland. Helena har sin egen Australia/Brisbane-klokke frem til ankomsten 17 nov kl. 18.10. Afgangen er anslået til 11.40 i Brisbane (3½ timers flyvning), og flyets bevægelse er en illustration, ikke flytracking.

GPS bruges kun fra besøgendes egen browser, når den befinder sig i NZ. Afvist, utilgængelig, forældet (over to minutter) eller udenlandsk GPS giver ca. position fra planen. GPS sendes ikke til en server, gemmes ikke og deles ikke mellem besøgende. Familien ser derfor et tydeligt mærket skøn, ikke live GPS. Åbne valg og ubooket færge markeres også i positionsdetaljerne. Personknapperne viser Karsten/NZ og Helena/Brisbane eller hendes anslåede flyvning.

`assets/trip-scenes.js` samler illustrationerne og CSS-motion. `assets/face-registration.js` indeholder lokalt målte øjen- og mundpunkter for alle 19 aktivitetsansigter; SVG-transformerne følger de målte punkter og tilpasser lyset til kroppens scene. Brug ikke skønnede hovedrektangler til placering. Målingerne kan genbygges med `swift scripts/register-face-landmarks.swift scripts/face-regions.json > /tmp/trip-faces.jsonl` og `python3 scripts/build-face-registration.py /tmp/trip-faces.jsonl`. Den godkendte original `assets/trip-world/characters-base.png` er den faste kilde til ansigterne; **gentegn ikke ansigterne ved rettelser af bil, telt eller udstyr**. Originalen har Karstens korte blonde hår med en lille mullet, overskæg, hvid T-shirt, ternet skjorte, beige baggy zip-off-bukser og Birkenstocks. Helena har ginghamkjole, røde flipflops, hestehale og ingen solbriller. Aktiviteter bruger passende vandre-, løbe- eller surftøj. Bilens telt er et sort hardshell med grå sider, sideåbning under overslaget og markise på begge langsider. Også Karsten alene sover i tagteltet. Campingudstyret er et selvstændigt billedlag, så det kan ændres uden at tegne personerne om.

Solodagene har arbejde, surf, mad og øl i campingstolen. Brisbane har løb, iskaffe, butikker, restaurant, serie og søvn efter kl. 22 lokal tid. NZ-camps har aftenhygge fra kl. 17 efter dagens kørsel og søvn kl. 22–07. Våddragter tørrer ved kystcamping. Små dyr på kortet er illustrationer af områdets dyreliv, ikke observationer. Fotos af seværdigheder vises ved indzoomning; fotograf og licens findes i stedets detaljer. Alle bevægelser respekterer reduced motion.

Telefonen åbner med kun kort, figurer og en lille positionskilde. Tryk på et frit sted for at vise eller skjule menu, personknapper, lagvalg, zoom og nøgletal. Nøgletallene er et lille kortoverlæg og optager ikke fast plads over mobilkortet. Program, Opgaver, Husk, Efter og Tips er tilgængelige fra kortets Menu-knap. Kortets geografiske udsnit bevares ved skærmrotation.

Kontrol: `node --test tests/*.test.cjs`, `node --check assets/rutekort.js` og `node --check assets/trip-scenes.js`. Browserkontrol bruger lokale fixtures med simuleret GPS, aldrig computerens virkelige position.

## Sådan lægges en ny tur ind

1. **Opret filen** `trips/ÅÅÅÅ-MM-sted.html`, fx `trips/2026-12-nordoeen.html`.

2. **Brug denne ramme:**

```html
<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Turens navn · Ture</title>
<meta name="theme-color" content="#0A6E76">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← Alle ture</a>
  ...
</div>
<script src="../assets/map.js"></script>
</body>
</html>
```

3. **Tilføj et turkort øverst i `index.html`.** Kopiér den eksisterende blok med kommentaren `TURKORT`. Flyt den forrige tur ned i sektionen Tidligere og skift dens badge til `done`.

4. **Commit og push.** GitHub Pages opdaterer efter cirka 30 sekunder. Hard-refresh med Cmd+Shift+R hvis den gamle version hænger.

```bash
cd ~/Desktop/ture
git add -A && git commit -m "Ny tur: ..." && git push
```

## Opbygningen af en turside

Rækkefølgen er bevidst. Det vigtigste øverst, alt opslagsværk foldet væk nederst.

1. **Header** med eyebrow, `h1`, standfirst og `.facts` med fire nøgletal.
2. **Stor grøn knap** (`.cta`) der åbner hele ruten i Google Maps med waypoints.
3. **Overblik** (`ol.ov`) med én linje pr. dag. Det er Karstens favorit og skal altid med.
4. **Ét dagkort pr. dag** (`article.day`). Den store dag får `class="day big"`.
5. **Foldbare paneler** (`div.panel > details`) til kort, vejr, vandringer, budget og booking.
6. **Footer** med kilder og dato for hvornår tallene er hentet.

### Overblikket

Hele turen på én liste, og samtidig sidens navigation. Hver række linker til sit dagkort.
Den hårdeste dag får `class="big"` på sit `<li>` og bliver orange. Der er ingen separat
springmenu, listen erstatter den.

```html
<ol class="ov">
  <li><a href="#fre">
    <span class="ov-day">FRE</span>
    <span class="ov-route">Christchurch → Waimate</span>
    <span class="ov-sleep">Victoria Park, Waimate</span>
    <span class="ov-drive">2 t 40</span>
    <span class="ov-cost">$50</span>
  </a></li>
</ol>
```

### Et dagkort indeholder

- `.day-head` med dag, dato, en tagline til højre, titel og en linje med resumé
- `.wx` med én `.wx-row` pr. sted der betyder noget den dag, typisk hvor man kører hen og hvor man sover. Hver række har chips: temperatur, vind i m/s, og om det er tørt eller vådt
- `.keys` med Vandring, Mad, Sov og hvad der ellers er. Hver linje kan have en `.pin` med kortlink og en `.cost` yderst til højre
- `<details>` med tidsplan (`ul.tl`) og noter (`p.note`)

### Kortlink

Alt der har en adresse skal have en `.pin`. Brug søgeformen, den er robust:

```
https://www.google.com/maps/search/?api=1&query=Stedets+Navn+By
```

Til satellitbillede af et terræn uden en præcis adresse:

```
https://www.google.com/maps/@-44.7050,169.0640,13z/data=!3m1!1e3
```

Til hele ruten:

```
https://www.google.com/maps/dir/?api=1&origin=Start&destination=Slut&waypoints=A%7CB%7CC&travelmode=driving
```

Husk `target="_blank" rel="noopener noreferrer"`.

## Designet

Alt ligger i `assets/style.css`. Rør ikke farverne i den enkelte turside.

- **Accent** er glacier-teal `#0A6E76`, i mørkt tema `#52CBD4`
- **Alpin-orange** `#B04618` bruges kun til ét: kulde, sne, risiko, den hårde dag
- **Skrifter:** Avenir Next Condensed til overskrifter, Charter til brødtekst, monospace til alle tal og labels
- **Telefon først.** Grundstilen er til smal skærm, og `@media (min-width: 720px)` lægger kun ovenpå
- **Begge temaer.** Farver defineres som variabler tre steder: `:root`, `@media (prefers-color-scheme: dark)` med `:root:not([data-theme="light"])`, og `:root[data-theme="dark"]`. Skriv aldrig en farve direkte i en komponent

Nye komponenter hører hjemme i stilarket, ikke i turfilen, så næste tur også kan bruge dem.

## Faner

Lange ture kan bygges som faner i stedet for én lang side: en fast bjælke øverst (`.appbar` med `.tabs`) og én `<section class="tab" id="...">` pr. visning, hvor alle andre end den første har `hidden`. Et lille script på siden viser fanen, som adressen peger på (`#kort`, `#naetter` ...), og et link til et element inde i en fane åbner fanen og springer derned. Kortfanen fylder resten af skærmen. Den store NZ-tur bruger faner.

## Tema: CPH Agentic

En tur kan bruge CPH Agentics identitet i stedet for glacier-teal: sæt `class="theme-cpha"` på `<body>`, hent Hanken Grotesk fra Google Fonts i `<head>`. Karsten vil ikke have logoet på tursiderne, kun stilen. Logofilerne `assets/cpha-logo-*.svg` ligger der, hvis det ændrer sig. Temaets farver står i bunden af stilarket. Lysgrøn er aldrig tekst på papir, der er ingen rød, og logoet findes kun i grøn, kul eller papir. Den store NZ-tur bruger temaet.

## Rigtigt kort

Når et nyt sted tilføjes, skal det have et foto af selve stedet både i stedlisten og i kortets infokort. Angiv fotograf, kilde og billedlicens ved fotoet.

`assets/rutekort.js` tegner ruten på et rigtigt kort med Leaflet 1.9.4 fra cdnjs og tre baggrunde: OpenStreetMap, OpenTopoMap (terræn) og Esri (satellit). Al data ligger i `<script type="application/json" id="rk-data">` på tursiden: køredage (`legs`), det der ikke er med (`extras`), det efter turen (`after`, orange, også med `maybe`), færger (`ferries`), pladser (`bases`), nummererede steder (`spots`) og forklaringen på farverne i bunden (`legend`), hver med færdig, escapet html til arket der glider op ved tryk. Se kommentaren øverst i filen. Kortet får fuld skærm med en CSS-klasse, så det også virker på iPhone, og på telefonen kan det flyttes med én finger i kortfanen og fuld skærm. Den gamle SVG-tegning med `assets/map.js` bruges stadig af de ældre ture.

## Vejrdata

**Live i siden.** `assets/forecast.js` henter vejr og bølger fra Open-Meteo i browseren, hver gang siden åbnes. Sæt `<span class="ov-wx" data-wx="lat,lon" data-date="ÅÅÅÅ-MM-DD"></span>` ind, fx i en række i overblikket, og `data-sea="lat,lon"` med et punkt lidt ude i vandet for bølger. Prognosen rækker 16 dage frem, dage længere ude viser hvornår vejret kommer. MetService kan ikke hentes fra browseren (den tillader kun about.metservice.com), og Surfline har ingen åbne data, så link til deres sider i stedet.

**Fast i siden.** MetService har et offentligt endpoint til de større byer:

```
https://www.metservice.com/publicData/localForecast<by>
```

fx `localForecastwanaka`, `localForecastqueenstown`, `localForecastchristchurch`, `localForecastoamaru`, `localForecasttimaru`, `localForecastalexandra`. Mindre byer ligger ikke i feedet, og deres websider bygges med JavaScript, så de kan ikke hentes. Brug det nærmeste punkt og skriv i siden at det er en stedfortræder.

Feedet giver **ikke** tal på vinden, kun Beaufort-ord. Omregning:

| MetService skriver | Beaufort | m/s |
|---|---|---|
| Light winds | 1–2 | 0,5–3 |
| Kun en retning, fx southwesterlies | 4, moderat | 5,5–8 |
| Fresh | 5 | 9–11 |
| Strong | 6 | 11–14 |

## Budget

Karstens satser pr. person pr. dag: morgenmad $5, frokost $10, aftensmad $20, øl eller drink $15. Benzin regnes på bilens 11 km/L og den aktuelle literpris. Camping og aktiviteter skal verificeres på udbyderens egen side, og hvis prisen kun findes hos tredjepart, skal det stå i siden med et telefonnummer.

Bekræftede bookinger i Opgaver markeres med `data-confirmed="true" checked disabled`, så ældre lokal afkrydsning ikke får dem til at se ubookede ud. Bevar de historiske campsite-ankre, også når deres dagnummer flyttes.
