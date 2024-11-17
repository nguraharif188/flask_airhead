from flask import Flask, request, render_template, send_file, jsonify
import aiohttp
import pandas as pd
import asyncio
import os

app = Flask(__name__)

# Helper function to fetch address info
async def fetch_address_info(session, address, max_retries=3):
    headers = {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-OYL-API-KEY': 'd6aebfed1769128379aca7d215f0b689',
    }
    json_data = {'address': address}

    for attempt in range(max_retries):
        try:
            async with session.post(
                'https://mainnet-api.oyl.gg/get-whitelist-leaderboard', 
                headers=headers, 
                json=json_data
            ) as response:
                if response.status == 200:
                    return await response.json()
            await asyncio.sleep(1)
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
            return None
    return None

# Process addresses and fetch data
async def process_addresses(addresses):
    data = []
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_address_info(session, address.strip()) for address in addresses if address.strip()]
        responses = await asyncio.gather(*tasks)

        for address, info in zip(addresses, responses):
            if info:
                data.append({
                    'address': address,
                    'wallet_rank': info.get('walletRank'),
                    'whale': info.get('whale'),
                    'priority': info.get('priority'),
                    'fatMeter': info.get('fatMeter'),
                    'guaranteedMint': info.get('guaranteedMint'),
                })
    return data

@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        addresses = request.form["addresses"].splitlines()
        if not addresses:
            return render_template("index.html", error="Please provide at least one address.")

        # Fetch data asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        data = loop.run_until_complete(process_addresses(addresses))

        # Create a DataFrame for results
        df = pd.DataFrame(data)
        html_table = df.to_html(index=False) if not df.empty else "No data found for the provided addresses."

        # Save to Excel file for download
        output_file = "results.xlsx"
        if not df.empty:
            df.to_excel(output_file, index=False)

        return render_template(
            "index.html",
            table=html_table,
            download_available=not df.empty
        )
    return render_template("index.html")

@app.route("/download")
def download():
    output_file = "results.xlsx"
    if os.path.exists(output_file):
        return send_file(output_file, as_attachment=True)
    return "No file available to download."

# HTML Template
TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Address Checker</title>
</head>
<body>
    <h1>Address Checker</h1>
    <form method="POST">
        <textarea name="addresses" rows="10" cols="50" placeholder="Enter addresses, one per line"></textarea>
        <br><br>
        <button type="submit">Check Addresses</button>
    </form>
    <br>
    {% if table %}
        <h2>Results:</h2>
        {{ table | safe }}
        <br>
        {% if download_available %}
            <a href="/download">Download Results as Excel</a>
        {% endif %}
    {% endif %}
    {% if error %}
        <p style="color:red;">{{ error }}</p>
    {% endif %}
</body>
</html>
"""

# Save the HTML template to a file
with open("templates/index.html", "w") as file:
    file.write(TEMPLATE)

if __name__ == "__main__":
    app.run(debug=True)
