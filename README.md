# Collaborative Sentence Rater

This web application allows users to rate sentences on a 1-5 scale, with all data being read from and saved to a central Google Sheet. It consists of a static frontend (HTML/CSS/JS) and a serverless backend powered by Google Apps Script.

## 🚀 How to Set Up and Deploy

Follow these three parts carefully.

### Part 1: Set Up the Google Sheet & Backend

1.  **Create a Google Sheet**:
    * Go to [sheets.new](https://sheets.new) to create a new spreadsheet.
    * In **Column A**, enter the sentences you want users to rate, one per row.
    * You can rename the sheet, but ensure the tab is named `Sheet1` or update the script accordingly.
    

2.  **Create the Google Apps Script**:
    * In your sheet, click `Extensions` > `Apps Script`.
    * Delete any placeholder code in the `Code.gs` editor.
    * **Copy the entire contents of the `Code.gs` file provided and paste it into the editor.**
    * Click the **Save project** icon (💾).

3.  **Deploy the Script**:
    * At the top right, click the blue **Deploy** button, then select **New deployment**.
    * Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
    * For "Description", you can type something like `Sentence Rater API v1`.
    * For "Execute as", select **Me**.
    * For "Who has access", select **Anyone**. **This is critical for the app to work.**
    * Click **Deploy**.

4.  **Authorize the Script**:
    * Google will ask you to authorize the script's permissions. Click **Authorize access**.
    * Choose your Google account.
    * You may see a "Google hasn't verified this app" warning. This is normal. Click **Advanced**, then click **Go to Untitled project (unsafe)**.
    * Review the permissions and click **Allow**.

5.  **Copy Your Web App URL**:
    * After deploying, a "Deployment successfully updated" window will appear.
    * **Copy the Web app URL**. It will look like `https://script.google.com/macros/s/.../exec`. This is your unique API endpoint.

### Part 2: Configure the Frontend

1.  **Edit `script.js`**:
    * Open the `script.js` file in a text editor.
    * Find the line that says `const SCRIPT_URL = '';`.
    * **Paste the Web app URL you copied in the previous step between the single quotes.**
    * Save the file.

### Part 3: Deploy the Frontend

You can run the frontend locally by opening `index.html` in your browser, but for sharing, you should host it online. GitHub Pages is a great free option.

1.  **Create a GitHub Repository**:
    * Create a new public repository on GitHub (e.g., `sentence-rater`).

2.  **Upload the Frontend Files**:
    * Upload the three frontend files (`index.html`, `style.css`, and your modified `script.js`) to this new repository.

3.  **Enable GitHub Pages**:
    * In your repository's **Settings** tab, go to the **Pages** section.
    * Under "Build and deployment", set the **Source** to **Deploy from a branch**.
    * Set the branch to **main** and the folder to **/(root)**.
    * Click **Save**.

4.  **Done!**:
    * After a few minutes, your site will be live at `https://<your-username>.github.io/<your-repo-name>/`. You can now share this link with anyone.