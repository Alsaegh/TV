# TV Remote – phone remote for the Samsung UA60KU7000

Static web page (HTML/CSS/plain JavaScript, no libraries, no server code). Anyone on the home Wi-Fi scans the QR
code on the TV and gets a remote. Created by Mohamed AlSaegh · 33132112 · version 1.0.0.

```
site/                  ← upload the CONTENTS of this folder (nothing else)
  index.html           the remote (all CSS + JS inside; CFG block at the top of the script)
  qr-poster.html       printable A4 "LOST THE REMOTE?" poster with its own QR encoder
  manifest.webmanifest, sw.js, icons/   add-to-home-screen + offline cache (https copies only)
extras/http-host.htaccess   optional, Mode B http host only (rename to .htaccess)
dev/                   tests, mock TV, icon generator – do not upload
```

---

## 1. Pick a mode

| | Mode A – Synology NAS (**recommended**) | Mode B – GitHub + http host (today) | Mode C – Android only |
|---|---|---|---|
| QR points to | `http://NAS_IP:8080/` | `https://USERNAME.github.io/tv-remote/` | same as B |
| New Chrome / Edge / Samsung Internet 147+ | works, **no** “local network” question (tested in Chrome 153) | works after one “Allow” (tested in Chrome 153) | same as B |
| Old Android (Note 8, Chrome 138) | works | works on the http host; may be pushed to its https copy (then one extra tap) | same as B |
| iPhone (Safari, Chrome) | works | often needs “iPhone: one quick step” (copy/paste) | use SmartThings |
| Works away from home | no (the TV isn't reachable anyway) | no | no |

Why A is best: the page and the TV are both on the home network, so new Chrome does not gate the connection
(Chrome only gates *public → home* and *home → this device*), iPhones get a plain-http page (no mixed content),
and a dedicated http-only port gives browsers that try https first nothing to get stuck on.

**One file for every mode.** Pages served from a private address (192.168.x.x, 10.x, `.local`, a single-word name)
never redirect, so the same `index.html` can sit on the NAS, GitHub and the http host at the same time.

## 2. Edit CFG (only place to edit)

Open `site/index.html`, find `var CFG = {` near the top of the script:

1. `DEFAULT_IP` – `192.168.100.22`.
2. `HTTPS_HOME` – your GitHub Pages address. Leave `MYNAME` in it (capitals) to switch that redirect off.
3. `HTTP_HOME` – the plain-http copy: `http://tv.site.je/` today, or the NAS address (`http://192.168.100.5:8080/`).
4. `VERSION` – raise it (1.0.1, 1.0.2 …) every time you upload a change.

Placeholders written in capitals (`MYNAME`, `YOURNAME`, `NAS_IP`) and `x.x.x.x` / `example.com` are treated as
"not set" and simply disable the redirect. Timeouts, contact name/number and app IDs are in the same block.

## 3. TV preparation (all modes)

1. Router: reserve `192.168.100.22` for MAC `cc:b1:1a:5b:22:ca` (DHCP reservation).
2. Without a remote, pressing **Allow** on the TV is awkward (use the control button on the TV itself, or the remote
   page on a phone that is already connected). To stop the question for every new phone:
   **TV Settings › General › External Device Manager › Device Connection Manager › Access Notification › Off**.
   Caution: then any phone or computer on the Wi-Fi can control the TV without asking.
3. A phone refused by mistake: same menu › **Device List** › set it to Allow, or delete it and connect again.

---

## 4. Mode A – Synology NAS (DSM 7.2 – 7.4)

Menu names are from Web Station 4 (DSM 7.2); DSM 7.3/7.4 did not announce Web Station UI changes, but I could not
open Synology's help pages to confirm every label – where a label differs, the alternative is given.
Tell me your NAS model and DSM version if anything doesn't match.

**Fixed address for the NAS**
1. Find the NAS MAC: **Control Panel › Info Center › Network** (or Control Panel › Network › Network Interface).
2. In the router, reserve an address for it, e.g. `192.168.100.5`. (Alternative: Control Panel › Network ›
   Network Interface › LAN 1 › Edit › IPv4 › *Use manual configuration*.)

**Install and publish**
3. **Package Center** › search *Web Station* › **Install**. This creates the shared folder `web`.
4. **File Station** › `web` › **Create folder** `tv-remote` › open it › **Upload** the contents of `site/`
   (index.html, qr-poster.html, manifest.webmanifest, sw.js and the `icons` folder).
5. Permissions (only if the page later shows *403 Forbidden*): right-click `tv-remote` › **Properties › Permission ›
   Create** › user or group **http** › **Read** › tick *Apply to this folder, sub-folders and files* › Save.
6. **Web Station › Web Service › Create** › **Static website** (on some versions: *Native script language website*
   with PHP *Not configured*) › name `tv-remote` › Document root **web/tv-remote** › HTTP back-end server **Nginx** › Create.
7. **Web Station › Web Portal › Create › Web service portal** › Service `tv-remote` › Portal type **Port-based** ›
   **HTTP port 8080** › leave **HTTPS unticked/empty** and **HSTS off** › Create. (If 8080 is taken, use e.g. 8088.)
8. On a phone on the home Wi-Fi open `http://192.168.100.5:8080/` – the pill should turn green.

**Make sure the NAS never answers https for the remote**
- Use the dedicated http-only port (step 7), **not** the default portal on port 80: DSM normally also answers https
  on 443 with the NAS certificate, so a browser that tries https first would hit a certificate warning
  instead of failing fast. On port 8080 there is no TLS at all, so any https attempt fails instantly and Safari 18.2+
  / Firefox / Chrome fall back to http (Safari's fallback is documented; whether Safari even tries https for a private
  IP is not documented – the port makes it irrelevant).
- Put the **IP address** in the QR, not a name: browsers never apply HSTS (forced https) to IP addresses.
- DSM's own "redirect HTTP to HTTPS" setting (Control Panel › Login Portal) only affects DSM ports 5000/5001.

**Keep DSM off the internet**
- Router: no port forwarding to the NAS (5000, 5001, 80, 443, 8080); UPnP off.
- **Control Panel › External Access**: QuickConnect off (if you don't use it); Router Configuration: no rules.
- Optional: **Control Panel › Security › Firewall** › allow TCP 8080 only from `192.168.100.0/24`.

**Poster and updates**
9. Open `http://192.168.100.5:8080/qr-poster.html` – the address is pre-filled – scan the on-screen code with a phone,
   then **Print** (A4). Optional CFG change: `HTTP_HOME: 'http://192.168.100.5:8080/'`.
10. Update later: raise `VERSION`, overwrite the files in `web/tv-remote` (File Station or the `\\NAS\web` share),
    then reload the page on each phone once (pull down to refresh).

## 5. Mode B – GitHub Pages + http host

**GitHub Pages (secure copy)**
1. github.com › **New repository** › name `tv-remote` › Public › Create.
2. **Add file › Upload files** › drag in the contents of `site/` (keep the `icons` folder) › **Commit changes**.
3. **Settings › Pages** (sidebar section "Code, planning, and automation") › Build and deployment › Source **Deploy from a branch** ›
   Branch **main** / **(root)** › **Save**. After about a minute the site is at `https://USERNAME.github.io/tv-remote/`.
   (github.io sites are always https; that can't be switched off – which is why the http copy exists.)
4. Put that address in `HTTPS_HOME`, commit the changed `index.html` (pencil icon › edit › Commit).

**http host (plain-http copy, e.g. InfinityFree)**
5. Upload the same files to `htdocs` (File Manager or FTP). `HTTP_HOME` = `http://tv.site.je/`.
6. Optional: upload `extras/http-host.htaccess` renamed to `.htaccess` (302 from https back to http).
   It may not beat Safari's own upgrade; remove it if the host complains about a redirect loop.
7. Print the poster from the **GitHub** copy (`…/qr-poster.html`), so the QR points to GitHub.

**What the routing does** (redirects at most once per visit, adds `?tw=1` to stop loops, keeps `?ip=`):
- Chrome / Edge / Samsung Internet **147+** (not iPhone) → secure copy; they get a "One tap to connect" button,
  then Chrome's own *Allow* question.
- Everyone else (iPhone, Safari, Firefox, older Chrome / Samsung Internet) → plain-http copy.
- iPhone on an https copy of the http host → shown at once: **iPhone: one quick step** (address box, *Copy address*,
  "tap the address bar › paste › Go"). Typed/pasted addresses are not upgraded by Safari.
- Other browsers stuck on https → **Open plain-http page** button + the same copy box.
- New Chrome on a public http page → **Open secure version** (Chrome refuses home devices from public http pages –
  confirmed in Chrome 153).

Known weak spots: InfinityFree free sub-domains answer https automatically (since May 2025) and can't turn it off, so
browsers that upgrade links land on its https copy. And from Chrome 154 (Oct 2026) Chrome warns before opening
*public* http sites (private addresses such as the NAS are exempt). Fixes: Mode A, or the hybrid below.

**Hybrid (keeps GitHub, drops the https trap):** set `HTTP_HOME` to the NAS address. iPhones and old Android that
open the GitHub QR are sent to the NAS (fine – the TV is only reachable at home anyway).

## 6. Mode C – Android only

Use Mode B, and in the poster tick **Add the iPhone note** ("iPhone? Use the free Samsung SmartThings app instead").
SmartThings support for this 2016 model is not verified – check in the app before printing.

---

## 7. Test checklist (real phones)

On every phone: join the home Wi-Fi › scan the QR › pill turns green › press VOL+/−, OK, Home › hold VOL+ (repeats) ›
lock the phone 30 s, unlock (reconnects by itself) › if anything fails: gear › **Copy log** › send it to Mohamed.

| Phone | Mode A (NAS) | Mode B (GitHub QR) |
|---|---|---|
| **Galaxy Note 8** (Chrome 138 or Samsung Internet) | opens the NAS page, green in ~1 s | sent to `http://tv.site.je/`; if it shows *Open the plain-http page*, tap it; if it comes back, use *Copy address* and paste |
| **New Android** (Chrome 147+) | green, **no** question | "One tap to connect" › Connect › Chrome asks about devices on the local network › **Allow** |
| **iPhone Safari** | NAS page (first load may take a second if Safari tries https first), green | probably *iPhone: one quick step*: Copy address › tap address bar › paste › Go |
| **iPhone Chrome** | as Safari; if it never connects: iPhone Settings › Chrome › **Local Network** on (unverified tip) | as Safari |

First time per phone the TV may ask **Allow?** (unless Access Notification is Off).

## 8. Banner messages

| Banner | Meaning | Fix |
|---|---|---|
| Can't reach the TV | no answer from 192.168.100.22 | TV on (its own button), phone on home Wi-Fi (not guest/mobile data), IP right |
| Look at the TV / Nobody pressed Allow | TV is asking / asked about "Web Remote" | choose Allow on the TV, or turn Access Notification off |
| The TV refused this phone | Device List says Deny | Device List › Allow (or delete) › Try again |
| The TV closed the connection | TV hung up before answering | Try again; restart the TV with its own button |
| One tap to connect | new Chrome on the GitHub copy | tap Connect, then Allow in Chrome's question |
| Chrome is blocking the TV | Chrome's local-network permission was refused | lock icon › Permissions/Site settings › Local network access (newer Chrome: "Apps on device") › Allow |
| Open the secure version | new Chrome on a public http page | tap the button |
| Open the plain-http page / iPhone: one quick step | browser on an https copy that it can't use | tap the button or copy/paste the address |
| Lost the connection to the TV | 4 automatic retries failed | TV off or phone left Wi-Fi; Try again |

Every banner ends with "Still stuck? Call Mohamed AlSaegh on 33132112" (tap to call, dials +97333132112).

## 9. Notes

- **Power** needs a second tap within 3 s (a phone can't switch the TV back on). Set `POWER_CONFIRM_MS: 0` for single tap.
- **Keys while disconnected**: up to 8 are kept and sent in order after reconnecting (the pill shows "· n waiting").
- **Apps**: sends `ed.apps.launch`; on plain-http pages it also sends the TV's REST "open app" request. App IDs and
  launching are not confirmed on this firmware.
- **Text**: sent to the TV's on-screen keyboard (open a search box on the TV first). Arabic works (UTF-8).
  The diagnostics log records only the length of typed text, never the text.
- **Privacy**: commands go straight from the phone to the TV; no analytics, nothing sent to any server.
  Only the TV address, last working port and (port 8002) pairing token are stored, on the phone.
- **Laptop shortcuts**: arrows, Enter = OK, Backspace = Return, Esc = Exit, + / − volume, M mute, H home, P power (twice),
  S source, Page Up/Down channels, 0-9 numbers.

## 10. What was tested, and what was not

Tested here (sandbox, real **Chrome 153** + mock TV, 34/34 end-to-end checks pass – see `dev/`):
- JavaScript parses as ES2017 (old iPhones/Android); no `innerHTML`.
- Mock TV (ws 8001, wss 8002 self-signed): connect, exact key messages, hold-to-repeat (mouse, touch, and the
  no-PointerEvent fallback), queued keys order and the 8-key limit, text (English + Arabic), app launch (WebSocket +
  REST), Power double-tap, keyboard shortcuts, auto-reconnect after a drop, wake-up reconnect and stale-socket refresh,
  port 8001 → 8002 fallback with token saved/reused/redacted, and every failure banner.
- Real Chrome 153 behaviour: NAS page → TV with no prompt; GitHub copy → `ws://192.168.100.22` works once the
  local-network permission is granted (mixed-content exemption); refused → explained; public http page → Chrome
  blocks the TV and the page offers the secure copy.
- Routing: 7 browsers (by user agent) × 4 start pages × with/without the browser's own https upgrade = 56 cases,
  correct page and notice, ≤ 4 document requests, no loops, `?ip=` kept.
- Service worker only on https and never during a redirect; layout at 320 px and 390 px; button names, focus outline,
  live status.
- QR encoder: 306 symbols (versions 1–14, all 8 masks) bit-identical to the python-qrcode library and decoded by
  zxing-cpp; the poster itself decoded from screen and PNG; prints as one A4 page.

**Not tested** (no hardware/browsers here):
- The real TV (Origin header acceptance, Allow flow, `KEY_PLUS100`/`KEY_HDMI` etc. on this firmware, app launch).
- Real Safari/iOS, iPhone Chrome, Samsung Internet, Firefox, Chrome 138 engines (user agents were simulated on
  Chrome 153; their https-upgrade behaviour was simulated both ways).
- iPhone haptic on press (Safari 17.4+ switch trick), Android vibration.
- Synology Web Station screens, GitHub Pages and InfinityFree hosting, the `.htaccess` file.
- Whether Safari tries https first for a private IP (not documented anywhere I could find).

## 11. Running the tests yourself (optional)

```
cd dev && npm install                       # acorn + ws
node check-syntax.js                        # ES2017 + no innerHTML
node mock-tv.js --host 127.0.0.1            # fake TV on this computer: put ?ip=127.0.0.1 on the page address
node qr-matrices.js qr-cases.json && python3 qr_verify.py qr-cases.json   # pip install qrcode zxing-cpp opencv-python-headless numpy
```
`e2e_test.py` reproduces the full browser suite on a Linux test machine (needs root for `net_setup.py`, plus
`test_server.py` and Playwright). Don't run `net_setup.py` on a normal PC.
