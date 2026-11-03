# DJ Coco Bay website

A responsive, editable menu website built with plain HTML, CSS and JavaScript.

## Run it
1. Extract the ZIP file.
2. Open `index.html` in a browser, or upload the whole folder to a static web host.
3. Tap **Edit menu** at the bottom-right of the page to edit categories, item names and prices.

## Menu editing features
- Change category names and icons.
- Add or remove categories.
- Add, rename, reprice or remove menu items.
- Changes save in that browser using local storage.
- Export the menu as a JSON backup and import it later.
- Reset to the original menu at any time.

## Important publishing note
This version stores edits in the browser where they are made. If you publish the website, visitors can see the published menu, but edits made on one device will not automatically update the website for everyone. For shared owner access and updates across devices, connect the editor to a database or CMS (for example, Firebase or Supabase) and add secure owner authentication.

## Files
- `index.html` — page content
- `style.css` — design and responsive layout
- `app.js` — menu data and editor functionality (the pudding, cake and payasam categories are ready for your item names and prices)
- `assets/coco-bay-emblem.png` — emblem cropped from your supplied poster
- `assets/menu-poster.jpg` — supplied menu poster used as a visual
