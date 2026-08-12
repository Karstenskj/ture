# Ture

Statisk side med rejseplaner. Ingen build, ingen afhængigheder, ingen npm. Ren HTML og CSS, som ligger direkte på GitHub Pages.

**Live:** https://karstenskj.github.io/ture/

## Filer

```
index.html              forsiden med menuen over alle ture
assets/style.css        hele designsystemet, deles af alle sider
assets/map.js           zoom og træk på inline SVG-kort
trips/ÅÅÅÅ-MM-sted.html én fil pr. tur
.nojekyll               så GitHub Pages ikke kører Jekyll
```

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
3. **Springmenu** (`nav.jump`) med én chip pr. dag. Den hårdeste dag får `class="hot"`.
4. **Ét dagkort pr. dag** (`article.day`). Den store dag får `class="day big"`.
5. **Foldbare paneler** (`div.panel > details`) til kort, vejr, vandringer, budget og booking.
6. **Footer** med kilder og dato for hvornår tallene er hentet.

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

## Vejrdata

MetService har et offentligt endpoint til de større byer:

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
