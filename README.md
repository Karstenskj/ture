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

**Datoer og bookinger opdateret 14 nov:** Brugeren har valgt at rykke alle etaper fra den oprindelige start man 16 nov én dag frem og forkorte Motutere Bay til én overnatning. Helena lander tir 17 nov kl. 18.10 i Christchurch. Første rundturnat er Route79 tir 17 nov. Motutere Bay har én nat man 7 dec, afrejse tir 8 dec. Marokopa tir 8 dec, Raglan ons 9 dec–tor 10 dec og Auckland fre 11 dec er uændrede. Der er 24 rundturnætter. Før turen ligger Buxton Camp ved Gore Bay lør 14 nov, booket A1 Kaikoura søn 15 nov og booket Awaroa/Godley Head man 16 nov. I alt 27 nætter i kalenderen.

**Start og afhentning:** Karsten starter køreturen fra South New Brighton i Christchurch lør 14 nov om morgenen og kører til Buxton Camp ved Gore Bay, cirka 126 km/1 t 49 fra området. Efter brugerens valg viser den offentlige side kun et omtrentligt startpunkt i South New Brighton og ruten fra området; den private adresse og rutens præcise første stykke publiceres ikke. Første køreetape er med i kortets `legs` og den samlede kørsel. Hent Helena i Christchurch lufthavn tir 17 nov kl. 18.10; stoppet har sit eget kortpunkt og programanker `s-airport`. Bevar de øvrige steders numre og ankre. Lufthavnsfoto: CHCBOY, Wikimedia Commons, CC BY-SA 4.0.

**Færge, bekræftet ombooket 14 nov:** Picton→Wellington tir 1 dec 2026 kl. 07.45 for to voksne og bil (5,0 m). Bookingreferencen og kvitteringen må ikke publiceres. Ombookingsopgaven er fjernet; den eksisterende færgebooking er markeret bekræftet. Den præcise terminal og check-in-fristen følger den opdaterede billet og fremgår ikke af skærmbilledet. Planlagt bilafgang fra Mistletoe Bay kl. 04.45, cirka 1 t 18 kørsel; aftal tidlig biludkørsel/eventuel bom med pladsen. Sejltid ca. 3½ timer og ankomst ca. 11.15 er fortsat anslået i positionsplanen.

Buxton Camp ved Gore Bay (`c-buxton`, base 0) er Karstens bekræftede overnatning 14.–15. november; det erstatter Hurunui. Offentligt punkt fra OpenStreetMap: -42.8554415, 173.3115043, 707 Gore Bay Road. Prislisten siger $25 uden strøm/$30 med strøm for én voksen; faktisk betalt beløb er ikke oplyst. A1 Kaikoura Motel & Holiday Park (`c-a1-kaikoura`, base 20) er booket 15.–16. november, én voksen, én plads uden strøm, $45 i alt. Check-in 14–22, check-out 10 ifølge brugerens bekræftelse. Karsten sover i tagteltet, ikke i motelværelse. Det erstatter det foreløbige Gore Bay-ophold den 15. Godley Head (`camp-godley`, base 19) er booket 16.–17. november til én voksen uden strøm, $18 i alt. De tre solonætter er anslået til $88–93. Bookingreferencer, kvitteringer og personoplysninger må ikke publiceres.

Route79 17.–18., Lake Pearson 19.–20., Hans Bay 20.–21. og Otto/MacDonalds 21.–23. november er booket ifølge brugeren. Punakaiki Beach Camp er booket fra 23. til 24. november: én nat, afrejse den 24. Betalt beløb er ikke oplyst. Lake Poaka 18.–19. november erstatter Glentanner; pladsen er gratis og uden reservation. Mount Cook-besøgene er bevaret. Kørsel 18. november: cirka 276 km/4 t 01 inklusive Hooker/Sealy- og Tasman-parkeringspladserne, derefter Lake Poaka. Den 19.: cirka 298 km/4 t 03 via Castle Hill til Lake Pearson.

### Bookingstatus ét sted

Redigér kun `trips/2026-11-nz-bookings.js`, når et ophold bliver booket. Hver nøgle er campingkortets eksisterende anker; `base` er campingpladsens indeks i `rk-data.bases`, `from` er ankomst, og `until` er afrejse (eksklusiv). `task` er opgavens `data-k`. Tilføj kun `total` og `adults`, når den faktiske pris er oplyst; offentliggør aldrig bookingnumre eller kvitteringer. `assets/bookings.js` viser automatisk Booket i program, kalender og kort samt låser den bekræftede bookingopgave. Ingen build eller netværkskald kræves. Datoerne forhindrer, at en delvist booket fler-nætters plads får alle nætter markeret. Gratis pladser står som gratis, ikke booket.

Eksempel på en fremtidig bekræftet booking:

```js
'camp-anker': { base: 6, from: '2026-11-23', until: '2026-11-25', task: 'opgavens-data-k' }
```

Ved ændrede overnatningssteder eller ruter køres `python3 scripts/build-location-plan.py` for at opdatere familiens omtrentlige position.

Hans Bay ved Lake Kaniere er valgt fre 20 nov efter Lake Pearson tor 19 nov. Dorothy Falls og Hokitika Gorge besøges lør 21 nov før Franz Josef. Otto/MacDonalds Campsite ved Lake Mapourika har to nætter lør 21 nov–søn 22 nov, afrejse man 23 nov. Alex Knob er den planlagte vandring søn 22 nov: 17,2 km og cirka 8 timer retur, kun i egnede vejrforhold. Roberts Point er et gråt alternativ, ikke en ekstra vandring samme dag. Behold Alex Knobs Instagram-rating og direkte citat. Kør til Alex Knob Carpark på Glacier Access Road (-43.4123524,170.1770400), cirka 31 km/30 min tur-retur fra Otto. Tjek parkeringsskiltningen; afsæt eventuelt $20 NZD. Campingen koster $36 for to pr. nat; parkeringsafgiften ved vandringen er separat. Campingpladsernes ledighed skal kontrolleres for de nye datoer.

Brunner Mine, Pancake Rocks og aftensmad på Punakaiki Rocks Hotel & Garden Bar ligger man 23 nov; Punakaiki er booket 23.–24. nov. **Opdateret 24 nov fra brugerens bekræftelser:** Kerr Bay er booket 24.–25. nov, og de er ankommet den 24. The Barn i Marahau er booket 25.–27. nov til to voksne på én plads uden strøm, NZ$140 i alt, betaling ved ankomst og forventet ankomst den 25. ca. kl. 15.00. Wharariki er booket 27.–28. nov til to voksne og bil på én plads uden strøm. Faktisk pris på Kerr Bay og Wharariki er ikke oplyst. Via ferrata ligger foreløbig fre 27 nov kl. 09.30–13.30 inklusive udstyr på vej mod Wharariki; ingen aktivitetsbooking er bekræftet. Den 26. er en hel dag i Abel Tasman med aktiviteter efter valg og vejr. Vask tøj under de to nætter på The Barn. **Opdateret 25 nov:** Nelson City TOP 10 Holiday Park er planlagt 28.–29. nov, én nat, men ikke booket. Pris og ledighed er ikke afklaret. Plads til bilen med tagtelt skal aftales: det almindelige teltområde er “Small Tent Site – No Car”. Wharariki → Nelson den 28.: ca. 155 km/2 t 17. Nelson → Mistletoe Bay den 29.: ca. 109 km/2 t 19 før pauser. Kalender, campingkort, vejrområde og positionsplan følger det planlagte Nelson-stop. Mistletoe Bay fra den 29. og færgen 1. dec er bevaret.

Mistletoe Bay har to nætter søn 29 nov–man 30 nov. Mount Stokes er kun en mulig krævende tur man 30 nov; Onahau Point, Peninsula Track eller kajak er alternativer. Adgang og aktuelle Kenepuru Road-forhold skal kontrolleres. Whatamango og Momorangi er mulige alternativer til den sidste nat før færgen; Mistletoe Bay er fortsat valgt. Escarpment er ons 2 dec; Opunake tor 3 dec–fre 4 dec; Forgotten World Highway og Mangahuia lør 5 dec; Tongariro Crossing søn 6 dec; Taupō/Motutere Bay man 7 dec (én nat); Marokopa tir 8 dec; Raglan ons 9 dec–tor 10 dec; Auckland fre 11 dec.

Den ekstra Taupō/Rotorua-dag og dens 248 km/4 t 30 er fjernet fra den fastlagte rute. Steder, billeder og kortlink er bevaret som mulige udflugter, og udflugtsruten ligger blandt kortets ekstrature. Den fastlagte rute er cirka 4 000 km/64 timer. De 24 rundturnætter koster foreløbig cirka $784 for nætterne med kendt pris eller prisoverslag; The Barn er bekræftet til NZ$140, mens Kerr Bay og Wharariki fortsat bruger vejledende priser. Nelson City TOP 10 den 28. november, Wellington og to Opunake-nætter mangler pris. Nelson-natten er planlagt og ikke booket. De tre solonætter er anslået til $88–93 ud over rundturens budget.

Napier og hele East Cape-runden via Gisborne er fjernet efter brugerens ønske, inklusive ekstra kørespor, kortpunkt, stedkort og forslagsrækker. De øvrige fastlagte nætter er uændrede. Siden åbner som standard med satellitkort i CSS-fuldskærm og automatisk GPS; browseren skal have tilladelse til lokalitet. GPS-positionen opdateres løbende uden at flytte kortet efter første centrering. Direkte links til Program og andre faner bevares. Når fuld skærm lukkes, vises kun datolinjen, nøgletallene og kortet; introduktion og datoændringsforklaring er fjernet fra toppen. Zoom er glidende med brøkdele af zoomniveauer og uden heltalssnap. Knapperne zoomer et halvt niveau pr. tryk, og hjul/trackpad følger input løbende med hurtigere respons. Program beholder dagsdetaljerne. Hovedruten er grøn; alle ture efter Auckland, inklusive Northland, er orange. Campsites og overnatninger er lilla, øvrige stop er blå, og fravalgte steder er grå. I kortets overblik vises nætterne som prikker; datoerne kommer frem ved indzoomning. GPS-markøren er `assets/honda-accord-tourer-cw2.svg`: en blå Honda Accord Tourer CW2 set oppefra med pakket tagtelt og gult surfboard. Positionen er centreret på bilikonet. Brugeren annullerede ønsket om en ekstra rød færgepåmindelse; den eksisterende påmindelse er bevaret.

NZ-programmet vises som en kalender fra mandag til søndag med ét dagsprogram åbent ad gangen. Fanerne Nætter, Pladser og Steder er fjernet: camping- og stedkort er flyttet ind under Program, og stedernes eksisterende ankre åbner automatisk den rette dag og dens detaljer. Steder uden fast dag og Instagram-forslag ligger i Program under mulige ture. Bevar billeder, ratings, citater og kortlinks ved fremtidige ændringer.

Mobilkortet bruger hele bredden i Kort-fanen og kan åbnes i CSS-baseret fuld skærm, også på iPhone. Bevar viewport-fit=cover, safe-area-kanter, én-finger-navigation i kortfanen og muligheden for at gå til Program fra fuld skærm. På mobil vises campingprikker i overblikket; datoer og navne kommer frem ved indzoomning. Forklaringen åbnes med en knap, og stedkort kan udvides.

Valgte ekstra stop på Nordøen: Escarpment Track ons 2 dec (med returtransport mellem stationerne), Dawson Falls med Wilkies Pools tor 3 dec, Lake Mangamahoe som udflugt fra Opunake fre 4 dec samt Whangamōmona, Moki Tunnel, Mount Damper Falls og Tāngarākau Gorge lør 5 dec. Kørsel og vandfaldsafstikker er medregnet; den 5. december er en hel udflugtsdag. Rotokare og Zealandia er fravalgt. Hvert af de syv valgte stedkort har tre fotos.

Heldagen i Raglan tor 10 dec har et muligt surfbesøg ved Manu Bay. Axel og de andre anbefalede stedet og sagde, at surfen var bedre end ved stranden tæt på Te Kopua-campen. Besøget er en overvejelse, ikke en fast køreetape.

## Karsten og Helenas verden

`assets/route-position.js` beregner ca. position og aktivitet ud fra `locationPlan` i turens JSON. `scripts/build-location-plan.py` genbygger planen efter ændringer i datoer, nætter eller kørselsruter. Alle NZ-tider bruger Pacific/Auckland. Helena har sin egen Australia/Brisbane-klokke frem til ankomsten 17 nov kl. 18.10. Afgangen er anslået til 11.40 i Brisbane (3½ timers flyvning), og flyets bevægelse er en illustration, ikke flytracking.

GPS bruges kun fra besøgendes egen browser, når den befinder sig i NZ. Afvist, utilgængelig, forældet (over to minutter) eller udenlandsk GPS giver ca. position fra planen. GPS sendes ikke til en server, gemmes ikke og deles ikke mellem besøgende. Familien ser derfor et tydeligt mærket skøn, ikke live GPS. Åbne valg og den bekræftede færgeafgang fremgår af positionsdetaljerne. Personknapperne viser Karsten/NZ og Helena/Brisbane eller hendes anslåede flyvning.

`assets/trip-scenes.js` samler illustrationerne og CSS-motion. `assets/face-registration.js` indeholder lokalt målte øjen- og mundpunkter for alle 19 aktivitetsansigter; SVG-transformerne følger de målte punkter og tilpasser lyset til kroppens scene. Brug ikke skønnede hovedrektangler til placering. Målingerne kan genbygges med `swift scripts/register-face-landmarks.swift scripts/face-regions.json > /tmp/trip-faces.jsonl` og `python3 scripts/build-face-registration.py /tmp/trip-faces.jsonl`. Den godkendte original `assets/trip-world/characters-base.png` er den faste kilde til ansigterne; **gentegn ikke ansigterne ved rettelser af bil, telt eller udstyr**. Originalen har Karstens korte blonde hår med en lille mullet, overskæg, hvid T-shirt, ternet skjorte, beige baggy zip-off-bukser og Birkenstocks. Helena har ginghamkjole, røde flipflops, hestehale og ingen solbriller. Aktiviteter bruger passende vandre-, løbe- eller surftøj. Bilens telt er et sort hardshell med grå sider, sideåbning under overslaget og markise på begge langsider. Også Karsten alene sover i tagteltet. Campingudstyret er et selvstændigt billedlag, så det kan ændres uden at tegne personerne om.

Solodagene har arbejde, surf, mad og øl i campingstolen. Brisbane har løb, iskaffe, butikker, restaurant, serie og søvn efter kl. 22 lokal tid. NZ-camps har aftenhygge fra kl. 17 efter dagens kørsel og søvn kl. 22–07. Våddragter tørrer ved kystcamping. Små dyr på kortet er illustrationer af områdets dyreliv, ikke observationer. Fotos af seværdigheder vises ved indzoomning; fotograf og licens findes i stedets detaljer. Alle bevægelser respekterer reduced motion.

Telefonen åbner med kun kort, figurer og en lille positionskilde. Tryk på et frit sted for at vise eller skjule menu, personknapper, lagvalg, zoom og nøgletal. Nøgletallene er et lille kortoverlæg og optager ikke fast plads over mobilkortet. Program, Opgaver, Husk, Efter og Tips er tilgængelige fra kortets Menu-knap. Kortets geografiske udsnit bevares ved skærmrotation.

Den 15. er rækkefølgen Buxton → Harris Farms → Mangamaunu → A1 Kaikoura, cirka 123 km/1 t 56 uden pauser. Harris Farms Butchery, Bakery & Café på 28 Hall Street i Cheviot er bekræftet af Karsten som pie-stedet. `s-cheviot-pies` er flyttet fra bymidten til butikken (-42.8125233, 173.2743686), og måltidet er morgenmad/frokost. `s-mangamaunu` er et separat muligt surfstop: kun gode bølger OG andre surfere i vandet. Da forholdene ikke er kendte, viser positionsplanen en kystpause, ikke en automatisk surfscene eller bekræftet session.

Den 16. er `s-kaikoura-whales` en gratis morgenpause ved Point Kean-udsigtspunktet før Godley Head. Kør til Point Kean carpark og gå 200 m/5 min op ifølge DOC. Arter/sæsoner fra Kaikōura Wildlife Centre Trust: kaskelot året rundt i området, spækhugger særligt september–april, pukkelhval typisk maj–oktober. Det garanterer ikke observationer fra land; Point Kean er valgt for udsigten. Kortets dyr er illustrationer. 45–60 minutters spotting er afsat i den omtrentlige plan. Ruten Kaikōura→Point Kean→Sumner→Godley er cirka 213 km/3 t 25. Den 17. er Godley Head→Sumner→Challenge Opawa→NPD Brougham St→Christchurch lufthavn→Route79 cirka 167 km/2 t 43 uden ventetid. Bevar afhentningen kl. 18.10 og alle de bookede rundturnætter. Der er 70 stedpunkter.

Whatamango (`c-whatamango`, base 21) og Momorangi (`c-momorangi`, base 22) er genindsat som **måske**, efter brugerens valg om at vise begge. De har `optional: true`, lilla stiplede campmarkører, og stedkort under 30. november. De ændrer ikke de valgte nætter, hovedruten, budgettet eller familiens positionsplan. Whatamango koster ifølge DOC $30 for to uden strøm og ligger cirka 15 min fra terminalen. Momorangi koster $50 for to uden strøm/$56 med strøm i november, cirka 13 km/25 min fra Picton. DOC siger, at Momorangi ikke er egnet til udkørsel før kl. 07, så afgang og check-in skal afklares før den kan bruges til færgen kl. 07.45. Kajakudlejning ved Momorangi er nævnt i tidligere DOC-materiale; aktuel udlejning skal bekræftes. Udlejning ved Whatamango er ikke bekræftet. Begge pladser er ubookede og ledighed ikke tjekket.

### Kortets stedkort og campvejr

Rejs med og tidsafspilningen er fjernet efter brugerens ønske. Aktivitetssymboler og campmarkeringer er flyttet til `assets/trip-icons.js`/`.css`; den normale positionsplan og automatisk GPS er bevaret.

### MetService, dagslys og flyrute

NZ-siden bruger nu MetServices officielle, gratis indlejring i `assets/trip-forecast.js`, `assets/trip-camp-weather.js` og `trips/2026-11-nz-metservice.js`. Den tidligere Open-Meteo-integration er fjernet fra NZ-siden. Andre tursider beholder deres eksisterende integration.

MetServices widget viser de næste tre kalenderdage og indlejres uændret fra `services.metservice.com`. Rapportens navngivne by/område vises tydeligt og er en områdeprognose, ikke en måling på campingpladsen. Mappingen til urban/rural-lokationer er fra MetServices officielle widget-builder; destinationslinks er læst fra de officielle widgets. Bjergcampene ved Arthur’s Pass, Nelson Lakes og Tongariro linker til MetServices bjerg- og parkprognoser frem for en prognose fra en lavtliggende by. Der kræves ingen API-nøgle og købes intet. Widgetdata kopieres ikke til vores egen cache eller bruges som vejr-API.

Campdatoer udledes stadig fra positionsplanen inklusive afrejsedagen og mulige ekstra nætter. Datoer efter den officielle 3-døgnsvisning vises som ikke tilgængelige endnu; første mulige visningsdato beregnes som ankomst minus to dage. Der vises aldrig dagens vejr som en fremtidig campingdato. Ved delvis dækning står det tydeligt, at nogle af opholdets datoer ligger længere fremme. Den officielle widget har sine egne datoer. Visningen genindlæses efter 30 minutter, mens den er synlig, og efter genbesøg/online; midnat og ny dækning kontrolleres hvert minut. Skjulte faner holder pause. Links til den fulde MetService-prognose er tilgængelige på alle campkort og i dagsprogrammet. Iframes får kun en offentlig by/områdeslug; præcis GPS sendes ikke til MetService.

SunCalc 1.9.0 beregner solopgang, solnedgang, morgenlys, skumring, mørke og teltlys lokalt (BSD-2-Clause i `assets/vendor`). Person- og udstyrsbilleder er uændrede. Vi bruger ikke længere den fravalgte kildes skyer, regn, vind eller temperatur til kortets effekter. Den gratis MetService-widget leverer ikke programmatisk aktuelle vejrdata til animationerne, så ukendt vejr illustreres ikke som kendte forhold. Australien og flyet har fortsat ingen vejreffekter. Flyruten vises stiplet før afgang; Helena bliver i Brisbane indtil den anslåede afgang 17 november.

Sumner er `s-sumner` den 16. og 17. november: surf kun ved gode bølger, samt caféarbejde uden valgt café. Offentligt strandpunkt fra OpenStreetMap, ruter via Sumner (16.: ca. 213 km/3 t 25; 17.: ca. 167 km/2 t 43). Godley Head, Helena kl. 18.10 og Route79 bevares. Der er 70 stedpunkter.

**Ændret 16 nov efter Karstens ønske:** Den 17. arbejder Karsten på café og surfer i Sumner om dagen (surf kun ved gode bølger). Afgang fra Sumner er flyttet til ca. 15.45, så der er tid til to stop før lufthavnen ca. 17.15: `s-challenge-opawa` (Challenge Opawa, 11 Opawa Road, OSM -43.547225, 172.654379) til gasflasken og dæktryk, og `s-npd-brougham` (NPD Brougham St, 395 Brougham Street, OSM -43.547138, 172.64569) til benzin. Begge har aktiviteten `fuel` med pumpeikon. NPD ligger på nordsiden af Brougham Street, så OSRM-ruten kører ind via Brisbane Street og vender bagefter. Om aftenen på Route79 står en rød påmindelse om at fylde vand i vanddunken og oplade powerbanks (`.keys li.red` og `.note.red`, farven `--shout`). Fre 20 nov har Karsten møde med CBS kl. 09.30 dansk tid, som er kl. 21.30 NZ-tid på Hans Bay. Kun "møde med CBS" publiceres, ingen navne eller emne.

Arbejdskopier oprettes kun midlertidigt uden for Skrivebordet og slettes efter verificeret publicering. GitHub er den permanente kilde.

### Retur til bilen ved envejsture

Escarpment Track 2 december: parkér ved Paekākāriki station, tag Kāpiti Line sydpå til Pukerua Bay først og gå nordpå tilbage til bilen. Dagens afgange, billetpris og evt. erstatningsbus tjekkes hos Metlink. Te Araroa anbefaler stationsparkering; undgå Ames Street/Muri Road.

Tongariro 6 december: nemmest fra de valgte nætter er Tongariro Crossing Shuttles retur fra Mangahuia-stoppet på SH47, så bil og telt bliver på campen. Offentlig pris NZ$75 pr. person retur/NZ$150 for to. Køreplanen viser 05.55/07.25/08.40 fra Mangahuia og 13.30/14.45/16.00/17.15–17.30 fra Ketetahi; alle tider, præcist stoppested og retur til Mangahuia skal bekræftes ved booking. Alternativet er Tongariro Expeditions' Park & Ride nær Ketetahi med morgenshuttle og gang tilbage til bilen (fra NZ$65 pr. person). Sommerens parkeringssted er et andet end lavsæsonens. Gratis DOC-track-booking kræves til shuttle. Dette er transportforslag undersøgt 14 november 2026, ikke bookinger eller bekræftet ledighed. Kilder og bookinglinks er i begge stedkort på kortet og i Program.

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

### Opgradering 16 nov, glattere kort og bedre program

Kortet ligger i `assets/rutekort.js` og i blokken `/* Kort 16 nov */` sidst i `assets/style.css`.

- Navnene på steder og pladser står inde i selve markøren (`.rk-label`) i stedet for 93 faste Leaflet-tooltips. Venstre side sættes med klassen `rk-label-left`, som sættes igen ved markørens `add` og efter hver `setIcon`, fordi Leaflet nulstiller `className`. Kun flyrutens navn er stadig en tooltip.
- Ruten tegnes med SVG-renderer og `padding: 0.5`, så den ikke klippes midt i et træk. `smoothFactor` er 1.5 på kant og linje og 4 på den usynlige trykflade.
- Fliserne hentes, mens kortet trækkes (`updateWhenIdle: false`, `keepBuffer: 4`). Terræn går til zoom 19 med `maxNativeZoom` 17.
- Kameraet flytter med `moveTo()`. Det flyver med `flyTo` ved store spring og bruger ellers en animeret `setView`, og ved `prefers-reduced-motion` springer det direkte. "Vis ruten" og flyknappen bruger `flyToBounds`.
- Arket glider ned, når det lukkes, og skjules først ved `transitionend` eller efter 340 ms. Det valgte sted flyttes kun fri af arket, når det ellers ville ligge under arket eller HUD'en, også efter en drejning af telefonen.
- GPS flytter ikke kortet, når den besøgende allerede har rørt kortet. "Find os" centrerer stadig.
- Klassen `rk-moving` sætter scenens, dyrenes og HUD'ens animationer på pause, mens kortet bevæger sig.
- Fotomarkørerne henter 180 px miniaturer fra `trips/img/2026-11-nz-rundtur/thumb/` med samme filnavn og falder tilbage til det fulde foto, hvis miniaturen mangler.
- Kortet har sin fuldskærmsform fra første maling, og JS sætter `rk-booted`, så siden ikke hopper på desktop. Dybe links som `#program` virker som før. Kommer `rutekort.js` eller Leaflet ikke igennem, sætter fanescriptet i bunden af tursiden `rk-booted` ved `DOMContentLoaded`, så resten af siden stadig kan bruges.

Data og fotos

- `scripts/simplify-route.py` udtynder køredagenes rutepunkter med Ramer-Douglas-Peucker på 3 m og runder til 5 decimaler. Første og sidste punkt og hver etapes `mid` bevares, så tidsmærkerne ikke flytter sig. Kør altid `scripts/build-location-plan.py` bagefter. Begge scripts kan køres igen uden at ændre noget.
- `scripts/build-photos.py` kræver macOS `sips`. Det gør JPEG over 300 KB højst 900 px brede, når det sparer mindst 10 procent, og skriver miniaturerne til `thumb/`. Kør det, når der kommer nye fotos.
- `<head>` har preconnect til Esri-fliserne, dns-prefetch til OpenStreetMap og preload af Leaflet 1.9.4 fra cdnjs.
- Siden fylder nu cirka 870 KB mod 1,07 MB før, og køredagene har 11.322 punkter mod 19.252 før.

Program og kalender

- Kalenderen åbner på dagens dato i NZ-tid (Pacific/Auckland) mellem 14 nov og 11 dec og ellers på første dag. Dagen i dag får `is-today` og passerede dage `is-past`. Dybe links som `#dag5` vinder stadig. Testen ligger i `tests/trip-calendar.test.cjs`.
- Planændringer, priser og valget mellem Barn og Wharariki står ordret i den lukkede boks "Planændringer og priser" over kalenderen.
- Alle seks faner passer på en telefon. Tilbage og dagknapperne har 44 px trykflade, fotokreditter og lange links ombrydes, og `--shout` er mørkere i det lyse tema (#B3261E) af hensyn til kontrasten.
- Assets der ændres i samme runde, får samme `?v=` i tursiden. Denne runde er `?v=20261116-upgrade-v1`.

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

**Tilføjet 17 nov:** Fre 20 nov kl. 08–09 NZ-tid: "Snak med Frederik om CBS" på Lake Pearson, hvor Karsten vågner efter natten 19.–20. Påmindelsen er rød på campingkortet i Program og kortets ark samt først i fredagens dagsprogram. Det separate CBS-møde kl. 21.30 på Hans Bay er bevaret. Navn og emne i morgenpunktet er udtrykkeligt valgt af Karsten.

**Mobilkort 17 nov:** Personkortene for Karsten og Helena, positionsboksen, flyruteboksen, vejrboksen og knappen "Vis ruten" er fjernet fra mobilvisningen, også når kortets betjening er synlig. Det styres af `.rk-phone`, inklusive telefon i landskab.

**Campingpanel 17 nov:** Kortets campingpanel viser nu faciliteter, booking, kørsel, aktiviteter, påmindelser og links kompakt med det samme. Vejr og billeder åbnes hver for sig nedenunder. Lake Pearson: "Bade i søen" fredag 20 nov om morgenen før afgang, i både campingkort og fredagens program; Frederik-aftalen kl. 08–09 er bevaret.

**Bad undersøgt 17 nov:** Hokitika Swimming Pool har shower-only til $6 pr. voksen og hverdagsåbent 06–18 (kommunens 2026/27-prisliste og åbningstider). Muligt stop fre 20 nov. Punakaiki Beach Camp har varme brusebade inkluderet, også uden strøm, fra man 23 nov. KiwiCamp Hokitika: $3/5 min med Penny-nøgle, men shower-only-adgang skal bekræftes. Kaniere har officielle badezoner, DOC anbefaler stranden bag Otto ved Mapourika. Ingen aktuel vandprøve verificeret ved Pearson, Poaka eller Mapourika; LAWA kunne ikke åbnes under undersøgelsen. Ingen sø betegnes ubetinget ren. Praktiske oplysninger og kildelinks er tilføjet til de relevante campingkort.

**Badesymboler 17 nov:** `bases[].shower === true` giver en turkis natmarkør med bruser. Flaget er eksplicit, aldrig udledt af omtale af bad andre steder. 13 pladser: Buxton, Route79, Punakaiki, Kerr Bay, The Barn, Wharariki, Mistletoe, Opunake, Motutere, Marokopa, Te Kopua, A1 og Momorangi (sidste er fortsat et alternativ). Opunake og A1 er nu tjekket på operatørernes egne sider. `bathing` tilføjer uafhængige kortpunkter for Hokitika-poolens shower-only, KiwiCamp (adgang ubekræftet), og søbad ved Pearson (forbehold), Kaniere, Mapourika, Rotoiti/Kerr Bay og Taupo/Motutere. Søsymboler er ikke en vandkvalitetsgaranti; alle henviser til dagsaktuel kontrol. Poaka er ikke markeret som anbefalet badested. Bruse-/svømmesymbolerne bliver synlige på mobil også i den rolige kortvisning. Koordinater for Hokitika-poolen: OSM way 290383679 (-42.7191171,170.9640671); KiwiCamp fra Rankers; søsymbolerne bruger den eksisterende camps koordinat med pixelafstand til natmarkøren. Rute og overnatninger er uændrede.

**CBS-møde opdateret 17 nov efter skærmbillede:** Beskeden angiver fre 20 nov kl. 09.00/09.30 dansk tid. Europe/Copenhagen er UTC+1 og Pacific/Auckland UTC+13 den dag, så start er kl. 21.00 eller 21.30 NZ-tid samme fredag på Hans Bay. Starttidspunktet er ikke entydigt bekræftet. Kalender, fredagens program og Hans Bay-campingkort i Program og kortets panel er opdateret. Den separate Frederik-samtale kl. 08–09 NZ-tid på Lake Pearson er bevaret. Ingen navne eller mailmodtagere fra skærmbilledet er tilføjet.

### Lyserøde forslag og gule punkter (20 nov)

`trips/2026-11-nz-ideas.js` holder `window.tripIdeas` og `window.tripIdeaNotes`. Det er sjove ting uden vandring til højst $200 pr. person, undersøgt fre 20 nov; vinturen fra Auckland må koste mere. `assets/trip-ideas.js` gør dem til lyserøde punkter på kortet (`st: 'idea'`) og til en liste under hver dag i Program. Forslag efter 11 dec står i fanen Efter. `tripIdeaNotes` har én note pr. dato og `after` for dagene i Auckland.

Gule punkter er forslag med feltet `vouchers`: Helenas Gifting Owl-gavekort ($83 AUD) og Viator-kredit ($60 AUD, højst $120 AUD for to i alt). Begge sider afviser automatiske opslag, så priserne dér er ikke læst, og mærket siger "tjek prisen". Viator-kreditten bruges på én booking, og en rest går tabt.

Fjern et forslag ved at slette dets blok i datafilen. Forslagene har ingen fotos. Intet er booket.

Ledighedstjekket fra 20 nov står i campingkortenes række Ledighed og øverst i Opgaver. DOC's bookingside afviser automatiske tjek, og det må ikke omgås; Kerr Bay og Mangahuia er derfor kun vurderet ud fra størrelse og ugedag.

Ikke færdigt 20 nov: priser hos Gifting Owl og Viator, begivenheder på datoerne 5 til 11 dec, overnatning i Auckland fra 11 dec, og en del åbningstider, som står markeret "Ikke bekræftet" på kortene.

**Opdateret lør 21 nov:** Codex efterprøvede 82 forslag uafhængigt (42 bekræftet, 8 rettet, resten har rigtig pris, men ledige pladser kan kun ses ved booking) og fandt 15 nye ting, blandt andet gratis glowworms ved Punakaiki og den gratis varme flod i Taupō. Der er nu 99 forslag. Kajak ved Punakaiki koster $50 pr. voksen, ikke $30. Spellbound afgår fra 334 Boddies Road i Oparure. Forslag til overnatning i Auckland 11 til 17 dec står på Aucklands kort og i Opgaver; intet er valgt.

**Via ferrata, præciseret 22 nov:** Tākaka Hill er efter campingbookingerne 24 nov flyttet til fre 27 nov kl. 09.30–13.30 inklusive udstyr hos Ngarua Caves, træning, klatring og returnering. Aktivitetsdatoen er tydelig i kalender, dagsprogram, stedkort og kort. Ruten omkring dagen afventer brugerens valg. Officiel kilde anbefaler 3–4 timer for hele oplevelsen; Ngarua åbner kl. 09.30, lejen er NZ$10 pr. sæt i op til fire timer, og udlejning indstilles i våde forhold. Reservation og faktisk ledighed er ikke bekræftet. Kilder: https://viaferrata.org.nz/via-ferrata-takaka-hill/faqs/ og https://viaferrata.org.nz/via-ferrata-takaka-hill/hire-gear-submenu/ .

**25 nov · Wellington og Mount Stokes:** Airbnb i Vic Central på The Terrace er booket 1.–2. dec; check-in efter 14, check-out før 11. Prisen er ikke oplyst. Lejlighedsnummer og nøgle-/adgangsoplysninger fra brugerens skærmbillede offentliggøres ikke. Base 11 og kortets vejgeometri er flyttet til bygningen, og camp-day-13/t10-20261113 er bekræftet via bookinglisten. Parkering er separat: foreslået Wilson Upper Willis Street, 192 Willis Street, udendørs og døgnåbent. Nat 17–07 NZ$6/7 (app/automat) plus dagsbetaling og gebyr; ingen bevogtning eller reservation er bekræftet. Mount Stokes er fortsat et muligt tilvalg 30. nov: parkering ved Titirangi/Anakoha-krydset ca. -41.08684,174.138134, 35 km/1 t 25 hver vej fra Mistletoe Bay før forsinkelser. Stiplet ekstrarute vises på kortet. Kommunens melding 11. nov varsler lukninger efter Portage mandag–torsdag 08–12 og 12.30–17 frem til 18. dec. Afklar passage begge veje; Onahau Point/bugten anbefales ellers før morgenfærgen. Kilder og praktiske links findes i program og kort.

**25 nov · SHOW old trips:** NZ-kortet har et særskilt historiklag i `assets/trip-history.js`, som er skjult fra start. Knappen skifter mellem SHOW/HIDE old trips og bevarer den oprindelige kortvisning, når laget skjules. Grå stiplede vejlinjer for Sydøen 14.–19. august med Helena og 14.–17. oktober med mor er genskabt fra gemte planer, ikke GPS-spor eller bekræftede besøg ved alle stop. Tryk på en linje eller historikstriben for detaljer. Augustkilden er `trips/2026-08-sydoeen.html` og memory; oktoberkilden er brugerens daterede plan i den tidligere chat “Find de flotteste hikes hver dag”. Rob Roy/Mount Aspiring og alternative campingpladser er uafklarede i historikken og indtegnes ikke som gennemførte. Den aktive og arkiverede Codex-chatoversigt samt den lokale Obsidian/memory-mappe og spejlet er gennemgået for flere NZ-ture. Generelle tidligere besøg uden sammenhængende rute/dato bliver ikke til opfundne turstreger. Australien er udeladt efter brugerens præcisering. `rk-data.pastTrips` er selvstændige data; ingen historisk rute indgår i `locationPlan`, aktuelle kilometer, bookinger eller “Vis ruten”. Historiklinjer er forenklet til 15 m tolerance for lav datamængde.

**25 nov · ny Taranaki-plan:** Brugeren fravælger Mount Taranaki-topbestigningen (`s38`), Wilkies Pools (`s11`) og Dawson Falls/goblin forest (`s63`); de er fjernet fra kort og program. Pouākai Tarns (`s55`, nu aktivt nummer 21) er valgt som vandring fre 4 dec via Mangorei Track fra den offentlige parkering på højre side cirka 200 m før vejenden. Regn ca. 11–12 km/5–6 timer med pauser, retur samme vej; der er ikke planlagt solopgang eller hytteovernatning. Afgang fra Ōpunake ca. 07, vandring fra ca. 08; kørsel 128 km/1 t 48 retur før pauser. Lake Mangamahoe (`s64`, nummer 24) er flyttet til tor 3 dec undervejs fra Waiinu til Ōpunake, 189 km/2 t 53 før stop. Campingnætterne bevares. Ved bedre bjergvejr den 3. kan aktiviteterne byttes; 4. er den foreløbige vandredato. Billede, Instagram-rating og citat for Pouākai er bevaret. Se DOCs aktuelle Mangorei Track-side og Venture Taranakis adgangsvejledning i programmet. Overskriften er nu ca. 4 050 km/65 timer og 67 steder; historikken tælles ikke med.

**25 nov · bugter den 26.:** Tinline, Coquille, Apple Tree og Stilwell Bay er fire valgbare vendepunkter fra The Barn/Mārahau; ikke fire fastlagte vandringer. De ligger i Program den 26., Abel Tasman- og Barn-kortet og som fire lyserøde valg på kortet. Tider er sat mere rummeligt end brugerens indsatte tekst efter den lokale operatørs Coast Track-guide: Tinline ca. 6 km/2 t retur, Coquille ca. 7 km/2–3 t, Apple Tree ca. 12 km/4–5 t, Stilwell ca. 14–15 km/anslået 5–6 t. Pauser og gang fra camp til indgangen kommer oveni. Ingen båd er nødvendig ved retur samme vej; ingen aktivitet eller vandtaxi er booket. Ingen tidevandstider eller garanterede badeforhold er påstået. Stedkoordinater fra OSM/Nominatim, Tinline ved selve bugten. 71 aktuelle steder i alt; historik uændret.

**25 nov · Northland ud og Coromandel ind:** Leigh/Goat Island, Tāne Mahuta, Cape Reinga, Duke's Nose og Warkworth er fjernet som stop, med begge Northland-rutespor. Coromandel er flyttet fra efter Auckland til fre 11 dec før eventuelt bilsalg. Hovedplan Raglan–Thames–Kauaeranga–Auckland ca. 273 km/3 t 55 før stop og trafik, med Kahikatea Walk/modeldæmning og Hoffmans Pool/picnic. Pinnacles, Cathedral Cove, The Lost Spring og Coastal Walkway er tilføjet i dagsprogram og kort som gensidigt begrænsende alternativer, ikke fire bookede aktiviteter. Østkyst via Hahei/Whitianga er væsentligt længere og overskrider 350 km-grænsen; præcise beregnede tal står i dagen. Coastal Walkway er meldt åben på regionens side opdateret 3 juli 2026; gamle lukkemeldinger fra tredjepart skal ikke stå som aktuel sandhed. Dets 20 km/7 timer og nordlige grusveje passer ikke denne dag. Waiheke er bevaret efter Auckland.
