## API Functionality Status

| Uri                                       |  GET  | POST | PUT | PATCH | DELETE | Tested     |
|-------------------------------------------|:-----:|:----:|:---:|:-----:|:------:|:----------:|
| /v1/users                                 |  Yes  | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/login                           |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/register                        |  -    | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/{id}                            |  Yes  | -    | Yes |  Yes  |  Yes   |   **Yes**  |
| /v1/users/verify?token=...                |  Yes  | -    | -   |  -    |  -     |   **Yes**  |
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
| /v1/station                               |  No   | No   | -   |  -    |  -     |   **No**   |
| /v1/station/{stationid}                   |  No   | -    | -   |  No   |  No    |   **No**   |