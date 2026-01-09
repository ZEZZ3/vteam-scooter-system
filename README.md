# Svenska Elsparkcyklar – Vteam Scooter System

System för uthyrning av elsparkcyklar i flera svenska städer. Det här repot innehåller backend/API, kundgränssnitt, admin, mobil webbapp, simulator och dokumentation (SDS).

## Setup
git clone git@github.com:ZEZZ3/vteam-scooter-system.git
cd vteam-scooter-system

### windows
.\setup-osrm.ps1

### linux/macos
chmod +x setup-route-server.sh
./setup-route-server.sh

docker-compose up -d

##  Översikt
- **Backend/API:**
- **Frontend:** Webbläsar-UI för kunder
- **Admin:** Webbläsar-UI för drift & zoner
- **Mobile webapp:** Mobilanpassad kundvy
- **Database:** SQL (MySQL/PostgreSQL)
- **Scooter (edge):** Enhet som rapporterar status
- **Simulator:** Genererar testdata & last

##  Repo-struktur
