# KlinikPustaka / DeretanPustaka — Google Sheets + Apps Script

## Important: use the files at the ROOT of this ZIP
Upload `index.html`, `script.js`, `style.css`, `favicon.svg`, the cover images, and `CNAME` to the root of the GitHub Pages repository. Do not upload an extra nested `deretanpustaka-main/` folder.

## 1. Spreadsheet structure
Create two sheets:

`Books` headers, in this exact order:
`id | title | author | genre | price | stock | cover | rating | description | status | tags`

`Orders` headers, in this exact order:
`order_id | timestamp | customer_name | whatsapp | items | total | status | notes`

Keep header names in row 1. The backend maps fields by header names for reads/updates; the create-row functions expect the listed column order.

## 2. Apps Script setup
1. Open the spreadsheet → Extensions → Apps Script.
2. Replace the project code with the complete `templates/Code.gs` file in this ZIP and save.
3. Open Project Settings (gear) → Script Properties.
4. Set `SPREADSHEET_ID` to the spreadsheet ID from its URL.
5. Set `ADMIN_PASSWORD` to the password you chose. The backend has no hardcoded password fallback.
6. Deploy → Manage deployments → Edit (pencil) or create a new Web app deployment.
7. Execute as: Me. Access: Anyone (or the broadest option allowed by your account). Deploy, authorize, and copy the Web app `/exec` URL.

## 3. Point the frontend at your deployment
Open root `script.js` and replace `API_URL` with your exact Apps Script Web App URL ending in `/exec`. The URL is an endpoint, not a password; do not put the spreadsheet ID or admin password in frontend files.

## 4. Deploy the website
Upload the root website files to `https://github.com/salsasena/deretanpustaka` (same directory as the repository's root `index.html`). Commit changes and wait for GitHub Pages to publish.

## 5. Test before relying on it
- Open `API_URL?action=ping`; expect JSON with `success: true`.
- Open the site and check the book list. If the database fails, the site shows an error instead of pretending fallback data came from Google Sheets.
- Login to Admin and test create/edit/delete with a temporary test book first.
- Confirm the test row appears/changes/disappears in the `Books` sheet.
- Place a test order and confirm a row appears in `Orders`.
- Test order status changes/deletion and confirm them in `Orders`.
- After changing Apps Script code or Script Properties, update the deployment version (Manage deployments → Edit → New version → Deploy). Saving the editor alone does not update an existing web app deployment.

## Security notes
- Admin requests are checked by Apps Script; hiding the admin button is not security.
- The server rejects admin access if `ADMIN_PASSWORD` is missing.
- Use HTTPS and a strong unique password. Consider changing the admin password later because it has been shared in chat.
- Do not treat a `no-cors` opaque response as proof that a write succeeded.
