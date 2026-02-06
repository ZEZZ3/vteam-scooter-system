# Svenska Elsparkcyklar – Vteam Scooter System

System för uthyrning av elsparkcyklar i flera svenska städer. Det här repot innehåller backend/API, kundgränssnitt (ej implementerad), admin, mobil webbapp (ej implementerad), scooter-server samt simulator.

## Översikt

- **Backend/API:** [Express-server & MongoDB](backend/)
- **Frontend:** [Webbläsar-UI för kunder](frontend/)
- **Admin:** [Webbläsar-UI för drift & zoner](admin-webb/)
- **Mobile webapp:** [Mobilanpassad kundvy](user-mobile/)
- **Webapp:** [Mobilanpassad kundvy](user-webb/)
- **Bike:** [Server som kommunicerar rörelse till backend och hanterar simulering](bike/)

## Setup

För att komma igång, kör:

```bash
git clone git@github.com:ZEZZ3/vteam-scooter-system.git
cd vteam-scooter-system
```

### .env

.env fil krävs i roten av projektet. För att testerna av backend ska fungera med `npm run test` krävs att .env också finns där. Se resurser filen i inlämningen för vad .env bör innehålla.


Simuleringen använder osrm för att generera realistiska "routes". För att osrm-servern ska fungera krävs det en osrm-fil (sweden-latest.osrm), som byggs i tre steg. För att göra det enklare kan man använda de inkluderade setup-filerna.

### Windows

```bash
.\setup-osrm.ps1
```

### Linux/macOS

```bash
chmod +x setup-route-server.sh
./setup-route-server.sh
```

Efter installationen ska det finnas en mapp './osrm-data', med all nödvändig data för att osrm-servern ska fungera.

### Docker

Projektet använder nedanstående containers.

| Service        | Beskrivning                           |
| -------------- | ------------------------------------- |
| `mongo`        | MongoDB-databas                       |
| `osrm`         | Routing-server för realistiska rutter |
| `backend`      | Express API                           |
| `backend-test` | Backend testmiljö                     |
| `admin-webb`   | Admin-UI                              |
| `user-webb`    | Kund-webb                             |
| `user-mobile`  | Mobilanpassad webb                    |
| `bike`         | Scooter-simulator                     |


Kom igång genom att köra:

```bash
docker-compose up -d
```

För att få simulerad data krävs det att man interagerar med bike-containern:

```bash
docker-compose up -d mongo osrm backend admin-webb user-webb user-mobile
docker-compose run --rm bike
```

För att nå resurserna används:

| Service     | URL                                            |
| ----------- | ---------------------------------------------- |
| Backend API | [http://localhost:3000](http://localhost:3000) |
| Admin Webb  | [http://localhost:8081](http://localhost:8081) |
| User Webb   | [http://localhost:8080](http://localhost:8080) |
| Mobile Webb | [http://localhost:8082](http://localhost:8082) |
| OSRM        | [http://localhost:5000](http://localhost:5000) |


## Felsökning

Ifall något inte fungerar är det nyttigt att använda: 

```bash
docker-compose logs -f <container>
```

Som ett första felsökningssteg, kontrollera att OSRM-servern fungerar:

```bash
docker-compose up -d osrm
docker-compose logs -f osrm
```

Om det indikeras att servern körs, och det hela fortfarande strular, kontrollera:

```bash
docker-compose up -d backend
docker-compose logs -f backend
```
