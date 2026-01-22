## Backend

###  Förklaring

`./backend` fungerar som ett REST-api, integrerat med socket-funktionalitet. 
Bike-servern kopplar upp sig med socket och uppdaterar cyklarnas data i realtid.
För detaljer på hur simuleringen fungerar se `./bike`.

### Användning
Som en testgrund finns en kartläggning av stockholmsområdet. Det inkluderar 7 olika zoner, med omkring 60 olika stationer spridda i de olika zonerna.

För att köra tester: `docker-compose run --rm backend-test` 
Det finns cirka 190 tester, så det tar en stund (runt 20 sekunder per testsvit).
Testerna är väldokumenterade och struktererade på ett sådant sätt så att man lätt kan sätta sig in och se hur API:et ska användas (eller inte användas).

Alternativt 
`npm install`
`npm run test` kör alla tester.
`npm run test:users` kör tester relaterade till `v1/users`.
`npm run test:rent` kör tester relaterade till `v1/rent`.
`npm run test:payment` kör tester relaterade till `v1/payment`.
`npm run test:history` kör tester relaterade till `v1/history`.
`npm run test:bikes` kör tester relaterade till `v1/bikes`.
`npm run test:city` kör tester relaterade till `v1/city`.
`npm run test:zone` kör tester relaterade till `v1/zone`.
`npm run test:station` kör tester relaterade till `v1/station`.

### API status

| Uri                                       |  GET  | POST | PUT | PATCH | DELETE | Tested     |
|-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|:----------:|
| /v1/index                                 |  Yes  | -    | -   |  -    |  -     |   **Yes**  |
| /v1/users                                 |  Yes  | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/login                           |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/register                        |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/{id}                            |  Yes  | -    | Yes |  Yes  |  Yes   |   **Yes**  |
| /v1/rent/{bikeid}                         |  Yes  | -    | -   |  -    |  -     |   **Yes**  |
| /v1/rent/start/{bikeid}                   |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/rent/stop/{bikeid}                    |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/payment/{userid}/fill                 |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/history?{userID}&{type}               |  Yes  | -    | -   |  -    |  -     |   **Yes**  |
| /v1/history/{userid}/payments/{paymentid} |  Yes  | -    | -   |  -    |  Yes   |   **Yes**  |
| /v1/history/{userid}/rides/{rideid}       |  Yes  | -    | -   |  -    |  Yes   |   **Yes**  |
| /v1/bikes                                 |  Yes  | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/bikes/{bikeid}                        |  Yes  | -    | -   |  Yes  |  Yes   |   **Yes**  |
| /v1/city                                  |  Yes  | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/city/{cityid}                         |  Yes  | -    | -   |  -    |  Yes   |   **Yes**  |
| /v1/city/{cityid}/zones                   |  Yes  | No   | -   |  -    |  -     |   **Yes**  |
| /v1/zone                                  |  Yes  | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/zone/{zoneid}                         |  Yes  | -    | -   |  Yes  |  Yes   |   **Yes**  |
| /v1/station                               |  Yes  | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/station/{stationid}                   |  Yes  | -    | -   |  Yes  |  Yes   |   **Yes**  |
| /v1/simulation                            |  Yes  | -    | -   |  -    |  -     |   **No**   |   
| /v1/simulation/{simulationID}             |  Yes  | -    | -   |  -    |  -     |   **No**   |     
| /v1/service/token                         |  -    | Yes  | -   |  -    |  -     |   **No**   |     
| /v1/service/simulation                    |  -    | Yes  | -   |   -   |  -     |   **No**   |     
| /v1/service/bikes                         |  Yes  | -    | -   |   -   |  -     |   **No**   |     
| /v1/service/stations                      |  Yes  | -    | -   |   -   |  -     |   **No**   |     
| /v1/service/zones                         |  Yes  | -    | -   |   -   |  -     |   **No**   |
| /v1/service/rent/start/{bikeid}           |  -    | Yes  | -   |   -   |  -     |   **No**   |
| /v1/service/rent/stop/{bikeid}            |  -    | Yes  | -   |   -   |  -     |   **No**   |    
*************************************************************************************************/
