## Status

| Uri                                     |  GET | POST | PUT | PATCH | DELETE | Tested |
|-----------------------------------------|:----:|:----:|:---:|:-----:|:------:|:------:|
| /v1/users                               |  Yes | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/login                         |  -   | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/register                      |  -   | Yes  | -   |  -    |  -     |   **Yes**  |
| /v1/users/{id}                          |  No  | No   | No  |  No   |  No    |   No   |
| /v1/users/verify?token=...              |  No  | -    | -   |  -    |  -     |   No   |
| /v1/rent/{bikeid}                       |  No  | No   | -   |  -    |  -     |   No   |
| /v1/payment                             |  -   | -    | -   |  -    |  -     |   -    |
| /v1/payment/{userid}/{rideid}           |  No  | No   | -   |  -    |  No    |   No   |
| /v1/payment/{userid}/fill               |  No  | -    | -   |  -    |  -     |   No   |
| /v1/history                             |  No  | -    | -   |  -    |  -     |   No   |
| /v1/history/{userid}                    |  No  | -    | -   |  -    |  -     |   No   |
| /v1/history/rides/{userid}              |  No  | No   | -   |  -    |  -     |   No   |
| /v1/history/rides/{userid}/{rideid}     |  No  | -    | No  |  No   |  No    |   No   |
| /v1/history/payments/{userid}           |  No  | No   | -   |  -    |  -     |   No   |
| /v1/history/payments/{userid}/{rideid}  |  No  | -    | No  |  No   |  No    |   No   |
| /v1/bikes                               |  No  | No   | -   |  -    |  -     |   No   |
| /v1/bikes/{bikeid}                      |  No  | -    | No  |  No   |  No    |   No   |
| /v1/city                                |  No  | No   | -   |  -    |  -     |   No   |
| /v1/city/{cityid}                       |  No  | -    | No  |  No   |  No    |   No   |
