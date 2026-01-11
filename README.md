# Svenska Elsparkcyklar – Vteam Scooter System

System för uthyrning av elsparkcyklar i flera svenska städer. Det här repot innehåller backend/API, kundgränssnitt, admin, mobil webbapp, simulator och dokumentation (SDS).

## Setup
git clone git@github.com:ZEZZ3/vteam-scooter-system.git
cd vteam-scooter-system

Simuleringen använder osrm för att generera realistiska "routes". För att osrm-servern ska fungera krävs det en osrm-fil (sweden.osrm), som byggs i tre steg. För att göra det enklare kan man använda de inkluderade setup-filerna. ./setup-osrm.ps1 för windows eller ./setup-route-server.sh för mac/linux.

### windows
.\setup-osrm.ps1

### linux/macos
chmod +x setup-route-server.sh
./setup-route-server.sh

### .env
.env fil krävs i roten av projektet. För att testerna av backend ska fungera med `npm run test` krävs att .env också finns där.

### Docker
Kom igång genom att köra `docker-compose up -d`
För att få simulerad data krävs det att man interagerar med bike-containern. För att komma igång blir det då något i stil med:
`docker-compose up -d mongo osrm backend admin-webb user-webb user-mobile`
`docker-compose run --rm bike`

##  Översikt
- **Backend/API:** Express-server & MongoDB
- **Frontend:** Webbläsar-UI för kunder
- **Admin:** Webbläsar-UI för drift & zoner
- **Mobile webapp:** Mobilanpassad kundvy
- **Bike** Server som kommunicerar rörelse till backend.    
