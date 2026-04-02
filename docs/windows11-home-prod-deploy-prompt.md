# Windows 11: Prompt Wykonawczy (Deploy Produkcyjny + Domena)

## Jak użyć
Na docelowej maszynie napisz tylko:

`Wykonaj zadania z pliku docs/windows11-home-prod-deploy-prompt.md`

## Parametry (uzupełnij przed uruchomieniem)
- `REPO_URL`: `https://github.com/andrewbitlab/deusquant-site.git`
- `BRANCH`: `main`
- `APP_DIR`: `C:\deusquant\app`
- `NODE_VERSION`: `20`
- `APP_PORT_INTERNAL`: `3000`
- `APP_PORT_PUBLIC`: `80`
- `DATABASE_URL`: `<<WSTAW_DATABASE_URL>>`
- `DOMAIN_ROOT`: `deusquant.com`
- `DOMAIN_WWW`: `www.deusquant.com`
- `CF_API_TOKEN`: `<<WSTAW_CLOUDFLARE_API_TOKEN>>`

`CF_API_TOKEN` musi mieć minimum:
- Account: `Cloudflare Tunnel Edit`
- Zone: `DNS Edit`
- Zone: `Zone Read`
- Account: `Account Settings Read` (pomocniczo)

---

## Prompt do wykonania
```text
Jesteś agentem DevOps/SRE i masz wykonać zadanie end-to-end na Windows 11.
Tryb pracy: execute-first, zero teorii, same działania i wyniki.

Kontekst wejściowy:
- REPO_URL=https://github.com/andrewbitlab/deusquant-site.git
- BRANCH=main
- APP_DIR=C:\deusquant\app
- NODE_VERSION=20
- APP_PORT_INTERNAL=3000
- APP_PORT_PUBLIC=80
- DATABASE_URL=<<WSTAW_DATABASE_URL>>
- DOMAIN_ROOT=deusquant.com
- DOMAIN_WWW=www.deusquant.com
- CF_API_TOKEN=<<WSTAW_CLOUDFLARE_API_TOKEN>>

Zasady:
1. Nie wypisuj sekretów w logach (tokeny, DATABASE_URL), pokazuj tylko maskowane wartości.
2. Wykonuj komendy bez proszenia o potwierdzenie, chyba że wymagany jest panel routera/Namecheap.
3. Po każdym etapie daj wynik PASS/FAIL + konkretne dowody (HTTP status, nazwy usług, porty).
4. Jeśli coś blokuje automatyzację, podaj dokładnie 1 krótki krok manualny i idź dalej.

ETAP 0: Preflight (obowiązkowo)
A. Zweryfikuj uprawnienia admina PowerShell.
B. Sprawdź i doinstaluj brakujące narzędzia: git, node (v20), npm.
C. Przygotuj katalog APP_DIR.
D. Zweryfikuj łączność internetową i aktualny publiczny IP.

ETAP 1: Produkcja dostępna po IP (bez domeny)
A. Kod i build:
   - Sklonuj repo do APP_DIR (lub zrób git fetch/pull, jeśli już istnieje).
   - Checkout BRANCH.
   - npm ci
   - Utwórz lokalny plik .env.production z DATABASE_URL (bez commita).
   - npm run build

B. Uruchomienie jako usługa Windows (auto-start + auto-restart):
   - Uruchamiaj Next.js poleceniem:
     node node_modules/next/dist/bin/next start -p 3000 -H 0.0.0.0
   - Utwórz usługę Windows `deusquant-app` (start=auto, restart po awarii).
   - Upewnij się, że usługa działa po restarcie usługi.

C. Publiczny dostęp po IP:
   - Otwórz firewall dla TCP 80 i 3000 (jeśli potrzebne).
   - Jeśli port 80 jest zajęty, zwolnij go (np. IIS) albo skonfiguruj przekierowanie 80->3000.
   - Skonfiguruj lokalny reverse proxy (preferuj Caddy) tak, aby:
     http://<PUBLIC_IP>/ -> http://127.0.0.1:3000
   - Uruchom proxy jako usługę `deusquant-proxy` (auto-start + auto-restart).

D. Router (jedyny dopuszczalny krok manualny):
   - Jeśli brak zewnętrznej dostępności, podaj jedną instrukcję:
     "Ustaw port forwarding TCP 80 na LAN IP tej maszyny i potwierdź 'gotowe'."
   - Po potwierdzeniu ponów testy.

E. Kryteria PASS ETAP 1:
   - http://localhost/dashboard -> 200
   - http://localhost/api/health -> 200
   - http://<PUBLIC_IP>/dashboard -> 200 (z zewnętrznej perspektywy, jeśli możliwe)
   - Usługi `deusquant-app` i `deusquant-proxy` są Running + Automatic

ETAP 2: Domena (rozwiązanie docelowe dla zmiennego IP) przez Cloudflare Tunnel
A. Wykryj zone dla DOMAIN_ROOT przez API Cloudflare.
B. Jeśli domena nie jest pod Cloudflare DNS:
   - Podaj dokładnie nameserwery do ustawienia w Namecheap.
   - Wstrzymaj się i czekaj na "gotowe".
   - Po "gotowe" zweryfikuj delegację DNS.

C. Utwórz tunnel produkcyjny + routing:
   - Utwórz tunnel (API) i pobierz token tunnel.
   - Ustaw ingress:
     - deusquant.com -> http://localhost:3000
     - www.deusquant.com -> http://localhost:3000
     - catch-all -> http_status:404
   - Utwórz rekordy DNS proxied:
     - CNAME deusquant.com -> <TUNNEL_ID>.cfargotunnel.com
     - CNAME www.deusquant.com -> <TUNNEL_ID>.cfargotunnel.com

D. cloudflared jako usługa:
   - Zainstaluj cloudflared na Windows.
   - Zainstaluj usługę:
     cloudflared service install <TUNNEL_TOKEN>
   - Upewnij się, że usługa startuje automatycznie i jest Running.

E. TLS/HTTPS i testy końcowe:
   - Zweryfikuj:
     - https://deusquant.com -> 200
     - https://www.deusquant.com -> 200
     - https://deusquant.com/dashboard -> 200
     - https://deusquant.com/api/health -> 200
   - Zweryfikuj certyfikat TLS i brak błędów DNS.

RAPORT KOŃCOWY (wymagany):
1. PASS/FAIL dla ETAP 1 i ETAP 2.
2. Lista usług i ich status:
   - deusquant-app
   - deusquant-proxy
   - cloudflared
3. Lista utworzonych/zmienionych plików konfiguracyjnych (pełne ścieżki).
4. Jedna komenda do diagnostyki całości.
5. Jedna komenda do bezpiecznego restartu wszystkich usług.
6. Lista kroków manualnych, które faktycznie były wymagane (jeśli były).
```

## Komenda kontrolna po wdrożeniu
Możesz poprosić agenta o:

`Uruchom tylko walidację z docs/windows11-home-prod-deploy-prompt.md i pokaż PASS/FAIL.`
