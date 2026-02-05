## Admin-webb

###  Förklaring

Koden representerar en admin-frontend för scooter-systemet.

### Användning

Koden är menad att köras i kombination med andra systemkomponenter, främst bike och backend.

För att få igång backend och admin-webb. Detta fungerar som ett interface mot databasen.

```bash
docker-compose up -d mongo backend admin-webb
```

För mer komplett körning:

```bash
docker-compose up -d mongo osrm backend admin-webb user-webb user-mobile
docker-compose run --rm bike
```
