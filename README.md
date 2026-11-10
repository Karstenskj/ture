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

**Afventer omlægning:** Helena lander tir 17 nov kl. 18.10 i Christchurch. Kalenderens hidtidige Sydø-datoer er udkast. Brugeren har endnu ikke valgt, om én Sydø-nat fjernes for at nå den bookede færge man 30 nov, eller om færgen flyttes til tir 1 dec. Ved flyttet færge skal én Nordø-nat også fjernes for at bevare Auckland fre 11 dec. Bookingen er stadig man 30 nov kl. 07.45 med check-in senest 06.45. Vælg ikke selv en nat at fjerne og ændr ikke færgebookingen. Gore Bay 14.–16. er bevaret; overnatning man 16 nov skal afklares.


Ankomsten til Auckland skal altid være fre 11 dec 2026. Alle 25 rundturnætter er fordelt. Derudover er Gore Bay foreløbigt lagt ind med to arbejdsnætter for Karsten lør 14 nov–søn 15 nov, afrejse man 16 nov; overnatning den 16. er nu uafklaret, da Helena først lander tir 17 nov kl. 18.10. I alt 27 nætter; præcis Gore Bay-afdeling og ledighed er ikke afklaret. Campens pris er $25/$30 pr. nat for én voksen uden/med strøm, samlet $50–60 ud over rundturens budget. Mobildækning findes, men Wi-Fi, en arbejdsplads og almindelig laptop-opladning skal bekræftes. Bevar de gamle dag- og campsite-ankre; de to nye dage hedder dag-for14/dag-for15. De to tidligere fleksible nætter er brugt på Franz Josef: Otto/MacDonalds Campsite ved Lake Mapourika fre 20 nov–lør 21 nov, afrejse søn 22 nov. Alex Knob er den planlagte vandring lør 21 nov: 17,2 km og cirka 8 timer retur, kun i egnede vejrforhold. Roberts Point er et gråt alternativ, ikke en ekstra vandring samme dag. Behold Alex Knobs Instagram-rating og direkte citat. Kør til Alex Knob Carpark på Glacier Access Road (-43.4123524,170.1770400), cirka 31 km/30 min tur-retur fra Otto. Tjek parkeringsskiltningen; afsæt eventuelt $20 NZD. Campingen koster $36 for to pr. nat; parkeringsafgiften ved vandringen er separat. Færgen er booket som angivet nedenfor; campingpladsernes ledighed skal kontrolleres.

Hans Bay ved Lake Kaniere er valgt tor 19 nov efter Lake Pearson i stedet for Goldsborough. Dorothy Falls og Hokitika Gorge besøges fre 20 nov før Franz Josef. Brunner Mine besøges søn 22 nov før Punakaiki (to nætter søn 22 nov–man 23 nov). Resten af den tidligere rute er flyttet to dage frem: Kerr Bay/evt. Angelus tir 24 nov; The Barn ons 25 nov og Wharariki fre 27 nov med den ekstra nat tor 26 nov valgfrit mellem de to. Begge har vaskemaskine; vask tøj dér, hvor de tager to nætter.

Mistletoe Bay har to nætter lør 28 nov–søn 29 nov. Mount Stokes er kun en mulig krævende tur søn 29 nov; Onahau Point, Peninsula Track eller kajak er alternativer. Adgang og aktuelle Kenepuru Road-forhold skal kontrolleres. Færgen Picton→Wellington er booket man 30 nov kl. 07.45 med seneste check-in kl. 06.45. Planlæg afgang fra Mistletoe Bay kl. 04.45 og aftal tidlig biludkørsel/eventuel bom med pladsen. Færgeselskab og terminal følger billetten; de er ikke oplyst i chatten. Whatamango er fravalgt. Escarpment er tir 1 dec; Opunake ons 2 dec–tor 3 dec; Forgotten World Highway og Mangahuia fre 4 dec; Tongariro Crossing lør 5 dec; Taupō søn 6 dec–man 7 dec; Marokopa tir 8 dec; Raglan ons 9 dec–tor 10 dec; Auckland fre 11 dec.

NZ-programmet vises som en kalender fra mandag til søndag med ét dagsprogram åbent ad gangen. Fanerne Nætter, Pladser og Steder er fjernet: camping- og stedkort er flyttet ind under Program, og stedernes eksisterende ankre åbner automatisk den rette dag og dens detaljer. Steder uden fast dag og Instagram-forslag ligger i Program under mulige ture. Bevar billeder, ratings, citater og kortlinks ved fremtidige ændringer.

Mobilkortet bruger hele bredden i Kort-fanen og kan åbnes i CSS-baseret fuld skærm, også på iPhone. Bevar viewport-fit=cover, safe-area-kanter, én-finger-navigation i kortfanen og muligheden for at gå til Program fra fuld skærm. På mobil vises campingprikker i overblikket; datoer og navne kommer frem ved indzoomning. Forklaringen åbnes med en knap, og stedkort kan udvides.

Valgte ekstra stop på Nordøen: Escarpment Track tir 1 dec (med returtransport mellem stationerne), Dawson Falls med Wilkies Pools ons 2 dec, Lake Mangamahoe som udflugt fra Opunake tor 3 dec samt Whangamōmona, Moki Tunnel, Mount Damper Falls og Tāngarākau Gorge fre 4 dec. Kørsel og vandfaldsafstikker er medregnet; den 4. december er en hel udflugtsdag. Rotokare og Zealandia er fravalgt. Hvert af de syv valgte stedkort har tre fotos.

Heldagen i Raglan tor 10 dec har et muligt surfbesøg ved Manu Bay. Axel og de andre anbefalede stedet og sagde, at surfen var bedre end ved stranden tæt på Te Kopua-campen. Besøget er en overvejelse, ikke en fast køreetape.

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

`assets/rutekort.js` tegner ruten på et rigtigt kort med Leaflet 1.9.4 fra cdnjs og tre baggrunde: OpenStreetMap, OpenTopoMap (terræn) og Esri (satellit). Al data ligger i `<script type="application/json" id="rk-data">` på tursiden: køredage (`legs`), det der ikke er med (`extras`), det efter turen (`after`, grønt med `maybe` når det kun er en overvejelse), færger (`ferries`), pladser (`bases`), nummererede steder (`spots`) og forklaringen på farverne i bunden (`legend`), hver med færdig, escapet html til arket der glider op ved tryk. Se kommentaren øverst i filen. Kortet får fuld skærm med en CSS-klasse, så det også virker på iPhone, og på telefonen flyttes det med to fingre, indtil det fylder skærmen. Den gamle SVG-tegning med `assets/map.js` bruges stadig af de ældre ture.

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
