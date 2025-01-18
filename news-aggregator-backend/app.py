from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import requests  # For making API requests

app = Flask(__name__)
CORS(app)  #Enable CORS for all routes

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('public', 'favicon.ico')

@app.route('/')
def index():
    # Serve the HTML page
    print("Rendering AI-news-aggregator.html")
    return render_template('AI-news-aggregator.html')

@app.route('/api/news', methods=['GET'])
def get_news():
    category = request.args.get('category', default='technology', type=str)
    print(f"Received category: {category}")  # Debug log
    api_key = 'c8f7bbd1aa7b4719ae619139984f2b08'
    url = f'https://newsapi.org/v2/top-headlines?category={category}&apiKey={api_key}'
    try:
        response = requests.get(url)
        if response.status_code == 200:
            news_data = response.json()
            return jsonify(news_data)
        else:
            return jsonify({"error": "Failed to fetch news"}), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    email = data.get('email')
    
    # Simulate storing the email in a database
    return jsonify({'status': 'success', 'message': f'Subscribed {email} successfully!'})

if __name__ == '__main__':
    app.run(debug=True)
