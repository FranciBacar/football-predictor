# Specifikacija Aplikacije: Football Predictor App (MVP)

## 1. Uporabniški računi in Avtentikacija
* **Prijava/Registracija:** Implementacija SSO (Single Sign-On) preko Google in Facebook računov za hiter vstop brez gesel.
* **Profil:** Osnovni podatki (ime in priimek, profilna slika povlečena iz SSO, email).
* **Upravljanje in GDPR:** Uporabnik ima v nastavitvah možnost trajnega izbrisa računa in vseh pripadajočih napovedi ter podatkov.

## 2. Upravljanje s tekmami (Match Data)
* **Vir podatkov:** Aplikacija avtomatsko črpa podatke iz zunanjega API-ja (npr. API-Football). To vključuje ekipe, datume, ure začetka, stadione in končne rezultate (popolna avtomatizacija brez ročnega vnosa).
* **Časovni pasovi (Timezones):** Sistem v ozadju vedno uporablja UTC čas, na uporabniškem vmesniku (UI) pa se ura tekme nujno prikaže v lokalnem času naprave uporabnika.
* **Status tekme:**
  * **Upcoming:** Napovedovanje je odprto.
  * **Locked:** Napovedovanje se zaklene natanko 15 minut pred uradnim začetkom tekme.
  * **In Progress:** Tekma se igra (opcijsko prikazovanje "live" rezultata).
  * **Finished:** API vrne končni rezultat, sproži se izračun točk.

## 3. Skupine (Groups / Leagues)
* **Kreiranje in Pridruževanje:** Uporabnik lahko ustvari poljubno število zasebnih skupin (npr. "Sodelavci", "Prijatelji") in ustvari unikatno kodo ali "magic link" za povabilo.
* **Arhitektura vnosa (Enkraten vnos):** Napoved je v bazi vezana neposredno na Uporabnika in Tekmo, *ne pa na skupino*. Uporabnik isti rezultat napove samo 1x, sistem pa ta rezultat avtomatsko aplicira na vse skupine, v katerih je uporabnik član.

## 4. Napovedovanje in Izločilni boji (Knockout Stage)
* **Vmesnik:** Pregleden seznam prihajajočih tekem z vnosnimi polji za rezultat. Napovedi je mogoče poljubnokrat spreminjati do statusa "Locked".
* **Posebna logika za izločilne boje:**
  Sistem prepozna, ali gre za tekmo v izločilnih bojih (`is_knockout = true`). V tem primeru deluje pogojni (conditional) UX:
  1. Če uporabnik napove zmago ene izmed ekip po 90 minutah (npr. 2:1), se ne zgodi nič dodatnega.
  2. Če uporabnik napove **REMI po 90 minutah** (npr. 1:1), se samodejno prikaže dodatno polje: **"Kdo se uvrsti v naslednji krog?"** z izbiro ene ali druge ekipe.
  3. To uporabniku omogoči varno napovedovanje podaljškov/penalov brez minus točk.

## 5. Pameten sistem točkovanja (Scoring System)
Točkovanje temelji izključno na rezultatu **po rednem delu (90 minut)**. Za vsako tekmo uporabnik dobi točke po najvišjem možnem kriteriju:
* **3 točke - Točen rezultat:** Natančno napovedan končni izid (Napoved: 2-1, Rezultat: 2-1).
* **2 točki - Pravilna razlika (ali remi):** Zgrešen točen rezultat, a pravilna gol razlika in zmagovalec (Napoved: 3-1, Rezultat: 2-0). Velja tudi za zgrešen točen remi (Napoved: 1-1, Rezultat: 2-2).
* **1 točka - Pravilen zmagovalec (Trend):** Pravilen zmagovalec, zgrešena razlika (Napoved: 1-0, Rezultat: 3-0).
* **0 točk - Napačno:** Zgrešen zmagovalec.

**Bonus za izločilne boje (+1 točka):**
Če je uporabnik v izločilnih bojih napovedal remi po 90 minutah in je dodatno **pravilno napovedal ekipo, ki napreduje** (po podaljških ali penalih), dobi **+1 bonus točko**. *(Maksimalen možen izkupiček za posamezno tekmo je torej 4 točke).*

## 6. Lestvice (Leaderboards)
* **Prikaz:** Mesto, Profilna slika, Ime, Skupno število točk.
* **Tie-breaker:** V primeru izenačenega števila točk, višje mesto zasede uporabnik z večjim številom "Točnih rezultatov" (3-točkovnih zadetkov).
* **Zmogljivost (Performance):** Izračun se zgodi asinhrono (v ozadju) takoj, ko tekma dobi status "Finished". Lestvica se ne preračunava ob vsakem osveževanju strani, temveč bere shranjene skupne točke.

## 7. Obvestila in Opomniki (Notifications)
* **Dnevni opomnik:** Sistem dnevno preveri bazo in pošlje opomnik (Email ali Push) izključno tistim uporabnikom, ki nimajo vnesene napovedi za tekme, ki se igrajo tisti dan.
* **Tedenski/Krožni povzetek:** Avtomatiziran email ob koncu določenega obdobja s statusom na lestvicah in prejetimi točkami.

---

## 8. Tehnični Stack in Podatkovna arhitektura (Priporočeno)

* **Frontend:** Next.js (React) - zasnovano kot PWA (Progressive Web App).
* **Backend, Baza & Auth:** Supabase (PostgreSQL).
* **Obvestila:** Resend (Email) / FCM (Push).
* **API za rezultate:** API-Football.

### Skica relacijske baze (Core Tables):
1. **`users`**: `id`, `name`, `avatar_url`, `email`
2. **`matches`**: `id`, `home_team`, `away_team`, `match_time_utc`, `is_knockout`, `status`, `actual_score_home`, `actual_score_away`, `actual_advancing_team`
3. **`predictions`**: `id`, `user_id`, `match_id`, `pred_score_home`, `pred_score_away`, `pred_advancing_team`, `earned_points`
4. **`groups`**: `id`, `name`, `invite_code`, `creator_user_id`
5. **`group_members`**: `group_id`, `user_id`
