## Bike

### Förklaring

Bike fungerar som en express server och är tänkt att kommunicera cyklars/scootrars rörelse. Uppdateringar skickas med hjälp av sockets till backend som lagrar ändringar i databasen. Bike-servern startar som en CLI, där man kan göra allmäna konfigureringar live, eller starta en simulation. 

Eftersom vi inte har någon riktig hårdvara så krävs att detta genereras. För att generera rörelse finns det några möjligheter, man kan till exempel välja slumpmässiga koordinater och därefter låta en cykel/scooter vandra runt i olika riktningar. Svårigheten är då att man kan hamna lite varsomhelts och man får kanske inte jättevärdefull data. För att motverka detta används en osrm-server för att skapa olika rutter inom ett specifikt land (sverige). I och med att denna kan köras lokalt så slipper man olika begränsningar som t.ex. Google Maps API har.

Simuleringar utgår från en simulerings-klass, där majoriteten av simuleringslogiken ligger. Simuleringar fungerar med hjälp av interval som går baserat på en "tickspeed" vilket då motsvarar hur fort en scooter byter koordinat längts sin definierade rutt. Tickspeed kan justeras dynamiskt mellan simuleringar. Det samma gäller med sändningsfrekvensen, alltså hur ofta en uppdatering av en cykels data skickas och uppdateras.

Säg att vi har en rutt med 300 koordinater. Rutten kan vara 5000m, med en medelsnitts hastighet på 10km/h tar denna rutt 30 minuter att genomföra. 300/60*30 = 0.167 punkter/sekund. 1/0.167≈6 ger alltså att en punkt bör ta omkring 6 sekunder. För att ha en approximativt real-tid simulering kan man alltså sätta tickspeed till 6000ms. Man får justera hastigheterna lite efter behov, med hänsyn till hur många scootrar man vill simulera.

### Användning

För att komma igång krävs en .env-fil i roten av github-repot.

Nedan syns ett exempelflöde för delsystemet.

![Demo1](../assets/simulation.gif)


Enklast kommer man igång genom att köra:

```bash
docker-compose run --rm bike
```

Detta kommer köra igång osrm och backend också. Om allt går väl så skapas en koppling mot backend och systemet är redo att skicka uppdateringar till databasen.

Bäst är om man kör igång hela systemet för att även ha tillgång till adminvyn där cyklar kan ses live.

```bash
docker-compose up -d mongo osrm backend admin-webb
docker-compose run --rm bike
```

För att se vad som händer på backend:ens sida kan det vara nyttigt att koppla upp via:

```bash
docker-compose logs -f backend
```

i en egen ruta.

När du nu har CLI:en mot bike så finns det ett antal kommandon man kan använda. Som en grund är det bra att köra `help`. En grundligare förklaring följer här nedan.

#### Simulate

Använd 'simulate' för att starta en simulering.

Starta en simulering med X-antal scootrar som kör Y-antal olika rutter var:

```
simulate start bikes <X> routes <Y>
```

Här får man ta hänsyn till att antalet simuleringar blir rätt stort, 100 cyklar som kör 10 rutter blir 1000 resulterande körningar. Stora antal X och Y blir resurskrävande, i hänsyn till beräkning, tid och minne. Här kan det vara värt att tänka på att det finns en övre gräns för hur många steg simuleringen kan gå, och om man vill säkerställa att alla rutter körs innan nedstägning så bör man höja `tickLimit`.

För att starta en simulering med X cyklar som kör en rutt var:

```
simulate start bikes <X>
```

#### Logg

För att visa logg från simulering:

```
simulate log
```

Detta kan man köra samtidigt som en simulering rullar för att se lite mer detaljer. När man sedan kör en simulering igen så skrivs loggen över. Logg sparas i databasen, men informationen som sparas är någorlunda begränsad.

#### Stoppa simulering

För att avbryta en simulering:

```
simulate stop
```

Tvingar en simulering att avbryta. Loggen kommer visa data upp till att man avbröt.

#### Konfiguration

För att konfigurera olika parametrar:

```
set 'parameter' <value>
```

Tillgängliga parametrar:

- `broadcastEnable`: true/false (default=true) – Slår på/av kommunikation med backend. Om kommunikationen är av så är det en helt lokal körning och den påverkar inte datan i databasen.
- `broadcastRate`: rate in ms (default=4000) – Ställer in hur ofta data skickas till backend.
- `tickrate`: rate in ms (default=1000) – Ställer in hur ofta scootrar byter sin position. Lite högre värde är mer trovärdigt i hänsyn till hur fort en scooter rör sig i verkligheten.
- `tickLimit`: max simulation tick (default=4000) – Ställer in hur många steg som tillåts i simuleringen. Om alla rutter inte är färdiga, så kommer simuleringen försöka göra klart de rutter som redan är igång.

För att se den nuvarande konfigureringen:

```
config
```

#### Enable

För att slå på sändning för alla cyklar:

```
enable
```

Skulle man ha riktig hårdvara så skulle det vara detta läge man vill ha. Cyklar som är "live" skickar kontinuerligt sin data. Logiken för att detta ska fungera finns implementerad som en grund i simuleringsklassen, men bike-servern implementerar inte funktionaliteten i nuläget.

#### Exit

För att stänga ned servern:

```
exit
```