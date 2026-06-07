# Football Predictor — Design Specification
**Za: Designer**
**Projekt:** Goodish Football Predictor — SP 2026
**Stack:** Next.js 16, Supabase, Tailwind CSS
**Datum:** junij 2026

---

## 1. NAMEN IN KONTEKST

Interna aplikacija za **Goodish ekipo** in prijatelje za napovedovanje rezultatov tekem na Svetovnem Prvenstvu 2026. Uporabniki vnesejo svoje napovedi pred vsako tekmo, sistem avtomatsko izračuna točke po koncu tekme in prikaže lestvico.

Aplikacija je primarno v **slovenščini**.

---

## 2. BRANDING

### Barve
```
Primarni gradient:  linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)
Primarna barva:     #0f766e  (teal-700)
Primarna svetla:    #e6faf8  (ozadja, poudarki)
Ozadje strani:      #f4f6f5  (svetlo sivo-zelena)
Besedilo:           #1a1a1a
```

### Logo
- Goodish logo: `https://goodish.agency/wp-content/uploads/2023/06/goodish-logotype-full-color-rgb-1024x251.png`
- Vidno v **navbaru** (desktop, levo) in na **login strani**
- Footer vsebuje link na goodish.agency

### Tipografija
- Trenutno: system font (Arial/Helvetica)
- Predlog za designerja: zamenjaj z Geist ali Inter za bolj tehničen, čist izgled

---

## 3. NAVIGACIJA

### Desktop (sticky top navbar)
```
[Goodish logo] | Napovedi | Lestvica | Skupine |          Profil →
```

### Mobile (fixed bottom navbar)
```
[ Napovedi ] [ Lestvica ] [ Skupine ] [ Profil ]
     ⚽           📊          👥         👤
```

Aktivni zavihek: teal gradient barva, ostali: sivi

### Footer (vse strani)
```
[Goodish logo]          SP 2026 Predictor  |  goodish.agency →
```

---

## 4. STRANI IN KOMPONENTE

### 4.1 LOGIN STRAN (`/login`)

**Namen:** Edina javna stran. Vse ostale zahtevajo prijavo.

**Elementi:**
- Goodish logo (klikabilen, vodi na goodish.agency)
- ⚽ emoji ikona v teal ozadju
- Naslov: "Football Predictor"
- Podnaslov: "Svetovno Prvenstvo 2026"
- Opcijski banner: "🎉 Prijaviš se in samodejno se pridružiš skupini!" (prikaže se ko pride z invite linkom)
- 3 OAuth gumbi: Google (bel), Facebook (modri #1877F2), GitHub (črni)
- Drobni tekst: "Made with ❤️ by Goodish"

**UX opomba:** Ko pride uporabnik z invite linkom (`/login?inviteCode=XXXX`), se po prijavi samodejno pridruži skupini.

---

### 4.2 DASHBOARD / NAPOVEDI (`/dashboard`)

**Namen:** Glavna stran — vnos napovedi za prihajajoče tekme.

**Elementi:**

**Pozdravni baner (vrh):**
- "Pozdravljen, [ime]! ⚽"
- Avatar (desno, mobile only)
- Podnaslov z navodilom

**Zavihki skupin:**
- Wrappable row (prelomi v več vrstic) — vseh 12 skupin + knockout faze
- Aktivni: teal gradient pill
- Neaktivni: bel pill z robom
```
Skupina A  Skupina B  Skupina C  ...  Skupina L
Krog 32  Osmina finala  Četrtfinale  Polfinale  Finale
```

**Kartica tekme:**
```
┌─────────────────────────────────────────────────┐
│ ned., 11. 06. ob 21:00                  ODPRTO  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Mehika        [ 0 ] : [ 0 ]      Južna Afrika  │
│                                                 │
│              [  Shrani napoved  ]               │
└─────────────────────────────────────────────────┘
```

**Status tekme:**
- `ODPRTO` — zelen tekst, vnos aktiven
- `ZAKLENJENO` — rdeč tekst, input disabled (15 min pred tekmo)

**Izločilni boji — pogojni UX:**
Ko uporabnik vnese remi (npr. 1:1) v izločilni tekmi, se prikaže dodatno polje:
```
┌─────────────────────────────────────────────────┐
│ 🟢 Ker si napovedal remi v izločilnih bojih,    │
│    kdo napreduje?                               │
│                                                 │
│  [ Mehika ]          [ Južna Afrika ]           │
└─────────────────────────────────────────────────┘
```

---

### 4.3 LESTVICA (`/leaderboard`)

**Namen:** Prikaz razvrstitve vseh igralcev po točkah.

**Elementi:**

**Zavihki:**
- "Globalna" (vsi opt-in uporabniki)
- En zavihek za vsako skupino, katere član je uporabnik
- Aktivni: teal gradient

**Tabela lestvice:**
```
#     Igralec              Točne    Točke
──────────────────────────────────────────
🥇    [avatar] Ime (ti)      3        12
🥈    [avatar] Ime           2         9
🥉    [avatar] Ime           1         7
4     [avatar] Ime           0         4
```
- Trenutni uporabnik: teal svetlo ozadje, teal barva točk
- Medalje za top 3 (zlata/srebrna/bronasta)
- Brez avatarja: inicialka v teal gradient krogu

**Sistem točkovanja (info box na dnu):**
```
🎯 Točen rezultat        3 točke
📐 Pravilna razlika      2 točki
✅ Pravilen zmagovalec   1 točka
⚡ Bonus (izločilni)    +1 točka
```

---

### 4.4 SKUPINE (`/groups`)

**Namen:** Ustvarjanje in upravljanje zasebnih skupin.

**Elementi:**

**Header kartica:**
- Naslov "Moje Skupine"
- Kratek opis

**Ustvari / Pridruži (2-stolpčna grid):**
```
┌──────────────────┐  ┌──────────────────┐
│ + Ustvari skupino│  │ 🔑 Pridruži se   │
│                  │  │    s kodo        │
│ [Ime skupine...] │  │ [Vnesi kodo...]  │
│                  │  │                  │
│ [ Ustvari ]      │  │ [ Pridruži se ]  │
└──────────────────┘  └──────────────────┘
```
- "Ustvari" gumb: teal gradient
- "Pridruži se" gumb: temno siv

**Kartica skupine:**
```
┌─────────────────────────────────────────────────┐
│ Goodish ekipa                        Admin  5 članov │
│                                                 │
│ [😀][😊][🙂][😄][🤗]  +2 več               │
│                                                 │
│ Povabilo link                                   │
│ /join?code=ab3c8f2e          [ 📋 Kopiraj ]    │
│                                                 │
│ [ 📊 Lestvica ]  [ 👥 Člani ↓ ]               │
└─────────────────────────────────────────────────┘
```

**Razprt seznam članov (po kliku "Člani"):**
```
ČLANI (5)
┌─────────────────────────────────────────────────┐
│ [😀] Franci Bačar                          (ti) │
│ [😊] Matevž Šauperl                     Admin   │
│ [🙂] Ana Novak                                  │
│ [😄] Marko Kovač                               │
│ [🤗] Petra Krajnc                              │
└─────────────────────────────────────────────────┘
```

**Invite link flow:**
1. Klik "Kopiraj" → kopira `https://app.domena.com/join?code=XXXX`
2. Prejemnik odpre link → samodejno se prijavi (OAuth) → samodejno se pridruži skupini → redirect na `/groups`

---

### 4.5 PROFIL (`/profile`)

**Namen:** Nastavitve računa.

**Elementi:**

**Profilna kartica:**
```
┌─────────────────────────────────────────────────┐
│  [avatar 64px]  Franci Bačar                   │
│                 franci@goodish.agency           │
└─────────────────────────────────────────────────┘
```

**Zasebnost (toggle):**
```
┌─────────────────────────────────────────────────┐
│ Zasebnost                                       │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🌐 Viden na globalni lestvici         [●] │   │
│ │    Tvoje ime in točke so vidni vsem.      │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```
- Vklop: teal obroba + teal ozadje
- Izklop: siva obroba

**Odjava:**
```
[ ← Odjava ]
```

**Izbriši račun (rdeče območje):**
```
⚠️ Nevarno območje
Trajno izbriše račun in vse napovedi.
[ Izbriši račun ]
→ confirm: [ Prekliči ] [ Da, izbriši ]
```

---

### 4.6 ADMIN PANEL (`/admin`)

**Namen:** Samo za admins. Upravljanje tekem in rezultatov.

**Dostop:** Samo uporabniki z `is_admin = true` v bazi.

**Elementi:**

**Vir podatkov (info kartica):**
- Prikaz da se rezultati berejo iz openfootball GitHub repota
- Link na repo

**Sync rezultatov:**
- Gumb "Ročni sync zdaj" (teal)
- Prikaz: Posodobljeno X | Preskočeno X | Napake X
- Cron teče avtomatično vsakih 30 min (Vercel)

**Ročni vnos rezultatov (seznam tekem):**
- Vsaka tekma: datum, ekipi, status (ODPRTO/ZAKLENJENO/KONČANO)
- Klik → razpre vnos:
  ```
  [ 0 ] : [ 0 ]   Mehika : Južna Afrika
  [Prekliči] [Shrani rezultat]
  ```
- Za izločilne tekme z remijem: dodatni gumb "kdo napreduje"

---

### 4.7 JOIN STRAN (`/join?code=XXXX`)

**Namen:** Tih redirect — ni UI. Ko pride z invite linkom:
1. Če ni prijavljen → redirect na `/login?inviteCode=XXXX`
2. Po prijavi → samodejno se pridruži skupini → redirect na `/groups`

---

## 5. SISTEM TOČKOVANJA

Točkovanje temelji na rezultatu **po 90 minutah**:

| Napoved | Rezultat | Točke |
|---------|----------|-------|
| Točen rezultat (2:1 → 2:1) | ✅ | **3 točke** |
| Pravilna razlika in zmagovalec (3:1 → 2:0) | 〰️ | **2 točki** |
| Pravilno napovedani remi (1:1 → 2:2) | 〰️ | **2 točki** |
| Pravilen zmagovalec, napačna razlika | 🏅 | **1 točka** |
| Napačen zmagovalec | ❌ | **0 točk** |
| **Bonus izločilni** (remi + pravilen napredovalec) | ⚡ | **+1 točka** |

**Maksimum: 4 točke** (točen izid v izločilnih bojih + bonus)

**Tie-breaker:** Enako točk → višje mesto dobi tisti z več "točnimi rezultati" (3-točkovnimi zadetki)

---

## 6. SKUPINSKA PRAVILA

- Maksimalno 50 članov na skupino
- Napoved je **enkratna** (1 napoved za 1 tekmo) — velja za vse skupine
- Kreator = Group Admin (lahko odstranjuje člane)
- Napovedovanje zaklenjeno **15 min pred tekmo**
- Lestvica se posodablja asinhrono (po koncu tekme)

---

## 7. ONBOARDING POTI

### A) Organski uporabnik
1. Odpre app → `/login`
2. Prijava → `/dashboard`
3. Nobene napovedi, nobene skupine → priporoči ustvari skupino

### B) Povabljeni uporabnik
1. Prejme link: `https://app.domena.com/join?code=XXXX`
2. Odpre link → `/join?code=XXXX`
3. Ni prijavljen → redirect `/login?inviteCode=XXXX`
4. Banner na login: "🎉 Prijaviš se in samodejno se pridružiš skupini!"
5. Prijava → samodejno se pridruži skupini → redirect `/groups`

---

## 8. PODATKOVNI MODEL (poenostavljen)

```
users           matches             predictions
─────────       ─────────────       ───────────────
id              id                  id
name            home_team           user_id →
email           away_team           match_id →
avatar_url      match_time_utc      pred_score_home
is_global_opt_in stage              pred_score_away
is_admin        is_knockout         pred_advancing_team
                status              earned_points
                actual_score_home
                actual_score_away
                actual_advancing_team

groups          group_members
──────          ─────────────
id              group_id →
name            user_id →
invite_code     joined_at
creator_user_id
```

---

## 9. STANJE RAZVOJA (junij 2026)

### ✅ Implementirano
- Auth (Google, Facebook, GitHub SSO)
- Dashboard s tekmo in napovedmi (vseh 72 tekem SP 2026)
- Knockout UX (remi → "kdo napreduje?")
- Skupinska lestvica + globalna lestvica
- Skupina: ustvari, pridruži se, člani, invite link
- Profil: opt-in, odjava, brisanje računa
- Admin panel: ročni vnos rezultatov, sync gumb
- Avtomatski sync rezultatov (openfootball, Vercel cron vsakih 30 min)
- Scoring trigger (samodejni izračun točk ob koncu tekme)
- Goodish branding (gradient, logo, footer)

### 🔜 Predlagano za naslednje
- Push / email notifikacije (opomnik za napovedi)
- Onboarding screen za novo prijavljenega (opt-in ekran)
- PWA (dodaj na domači zaslon)
- Strani za izločilne tekme (Round of 32 → Final)
- Statistike profila (moje napovedi, točnost %)
