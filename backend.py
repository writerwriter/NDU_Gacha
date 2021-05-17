import numpy as np
from tinydb import TinyDB
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

app = Flask(__name__,
            static_url_path='',
            static_folder='static')
CORS(app, support_credentials=True)

db = TinyDB('pool.json')

def gacha():
    pass

@app.route("/gacha_single/", methods=['POST'])
def gacha_single():
    return {
        'result': np.random.randint(3)
    }

@app.route("/gacha_ten/", methods=['POST'])
def gacha_ten():
    return {
        'result': np.random.randint(3, size=11).tolist()
    }

@app.route('/')
def main():
    return app.send_static_file('index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('./static/js', path)

if __name__ == '__main__':
    app.run('0.0.0.0', port=8999)