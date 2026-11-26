# InBestor

Learn to invest by playing. The website shows the three ways to play InBestor.

**Digital only (six games)**
- Market Day: build a portfolio across six sectors and ride out ten news cards (1 to 4 players, plus Steady Sam).
- Boom or Crash?: guess if a headline pushes a sector up or down.
- Sector Sort: match a headline to the sector it hits.
- Spread Your Eggs: place 12 eggs in six baskets, then survive the storm.
- Steady or Wild?: compare a calm investment with a wild one over five days.
- Grow Your Coins: piggy bank versus investing, with compound growth.

**Hybrid**: the InBestor console (Arduino 101) controls the Board Game Helper, Market Day and Boom or Crash? in Chrome or Edge on a laptop.

**Board game only**: the full rules are on the site (InBestor > Read the full rules, or add `#rules` to the address). The About page (`#about`) describes the whole project.

## Files

- `index.html`, `styles.css`, `app.js`: the website (no build step needed)
- `arduino/inbestor_console/inbestor_console.ino`: the code for the console

## Put it online with Vercel

1. Make a free account at github.com and at vercel.com (sign up to Vercel with your GitHub account).
2. On GitHub, click **New repository**, name it `inbestor`, set it to Public, and click **Create repository**.
3. Click **uploading an existing file**, drag in everything from this folder (including the `arduino` folder), and click **Commit changes**.
4. On Vercel, click **Add New > Project**, find `inbestor` in the list and click **Import**.
5. Leave every setting as it is (Framework Preset: Other) and click **Deploy**.
6. After about a minute Vercel gives you a public link like `inbestor.vercel.app`. Anyone can open it.

To update the site later, upload the changed files to the same GitHub repository. Vercel redeploys on its own.

## Connect the console

1. Install the Arduino IDE. In **Tools > Board > Boards Manager**, install **Intel Curie Boards** (for the Arduino 101).
2. In **Sketch > Include Library > Manage Libraries**, install **MFRC522**.
3. Open `arduino/inbestor_console/inbestor_console.ino`, plug in the Arduino and click **Upload**. The LED flashes red, green, blue when it starts.
4. Close the Serial Monitor, open the website in Chrome or Edge, and click **Connect console**. Pick the Arduino from the list.

If a control behaves oddly, change the settings at the top of the sketch:
- Confirm fires all the time or never: change `CONFIRM_PRESSED` to `LOW`.
- Left and right, or up and down, are backwards: set `FLIP_X` or `FLIP_Y` to `true`.
