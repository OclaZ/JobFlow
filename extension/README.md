# JobFlow Clipper Extension 🚀

## Installation Instructions

1.  Open **Chrome** or **Edge**.
2.  Navigate to `chrome://extensions` (or `edge://extensions`).
3.  Enable **Developer mode** (toggle in the top right corner).
4.  Click **Load unpacked**.
5.  Select this `extension` folder (`d:\postulation\extension`).

## Usage

1.  Go to a job post on **LinkedIn** or **Indeed**.
2.  Click the **JobFlow Clipper** icon in your browser toolbar.
3.  **Login** with your JobFlow credentials (if not already logged in).
4.  Click **Save to JobFlow**.
5.  The job will be added to your "Pending" list in the dashboard!

## Troubleshooting

*   **CORS Error**: Ensure the backend is running (`uvicorn backend.main:app --reload`) and the `main.py` has been updated to allow all origins.
*   **Not Scraping**: LinkedIn/Indeed layouts change often. If it fails, try another job post or manually copy/paste for now.
