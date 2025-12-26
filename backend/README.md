## API Functionality Status

| Uri                                     |  GET | POST | PUT | PATCH | DELETE | Tested |
|-----------------------------------------|:----:|:----:|:---:|:-----:|:------:|:------:|
| /v1/users                               |  Yes | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/login                         |  -   | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/register                      |  -   | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/{id}                          |  Yes | -    | Yes |  Yes  |  Yes   |   **Yes**  |
| /v1/users/verify?token=...              |  Yes | -    | -   |  -    |  -     |   **Yes**  |
| /v1/rent/{bikeid}                       |  Yes | -    | -   |  -    |  -     |   **Yes**  |
| /v1/rent/start/{bikeid}                 |  -   | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/rent/stop/{bikeid}                  |  -   | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/payment/{userid}/fill               |  -   | Yes  | -   |  -    |  -     |   **Yes**   |
| /v1/history                             |  No  | -    | -   |  -    |  -     |   No   |
| /v1/history/{userid}                    |  No  | -    | -   |  -    |  -     |   No   |
| /v1/history/rides/{userid}              |  No  | No   | -   |  -    |  -     |   No   |
| /v1/history/rides/{userid}/{rideid}     |  No  | -    | No  |  No   |  No    |   No   |
| /v1/history/payments/{userid}           |  No  | No   | -   |  -    |  -     |   No   |
| /v1/history/payments/{userid}/{rideid}  |  No  | -    | No  |  No   |  No    |   No   |
| /v1/bikes                               |  Yes  | Yes   | -   |  -    |  -     |   **Yes**   |
| /v1/bikes/{bikeid}                      |  Yes  | -    | -  |  Yes   |  Yes    |   **Yes**   |
| /v1/city                                |  No  | No   | -   |  -    |  -     |   No   |
| /v1/city/{cityid}                       |  No  | -    | -  |  No   |  No    |   No   |
