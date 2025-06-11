Funkcionalnosti

V projektu je implementiranih pet glavnih funkcij, ki pokrivajo različne tipe dogodkov v skladu z zahtevami naloge:

Funkcija: auth-check
Opis: Preverjanje pristnosti uporabnika na podlagi JWT tokena
Pokriva kategorijo: Avtentikacija

Funkcija: create-event
Opis: Vstavljanje novega dogodka v bazo podatkov
Pokriva kategorijo: Podatkovne spremembe

Funkcija: cleanup-events
Opis: Brisanje dogodkov, starejših od 24 ur
Pokriva kategorijo: Časovni dogodki

Funkcija: login-user
Opis: Uporabnik se lahko prijavi in pridobi se JWT token.
Pokriva kategorijo: Uporabniški dogodki

Funkcija: upload-file
Opis: Prijavljen uporabnik lahko naloži PNG sliko.
Pokriva kategorijo: Shramba in datoteke

Testiranje funkcij:

Funkcije sem testiral z orodjem Postman, kjer sem ustvaril zahteve tipa POST ali GET na URL-je funkcij.

Pri testiranju sem uporabil JWT avtentikacijo, ki sem jo dodajal v header Authorization: Bearer <token>.

Pri funkciji za nalaganje datotek sem testiral pošiljanje form-data z datoteko v telesu zahteve.

Preverjal sem različne odzive funkcij, kot so uspešno nalaganje, preverjanje pristnosti in validacija datotek.