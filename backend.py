import random
import numpy as np
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

app = Flask(__name__,
            static_url_path='',
            static_folder='static')
CORS(app, support_credentials=True)

pool = {
    'chance':{
        'gold': 0.65,
        'silver': 0.30,
        'rainbow': 0.05
    },
    'remain':{
        'gold': 999999999,
        'silver': 190,
        'rainbow': 30
    }
}

def snap49(results):
    score = sum([{0: 1, 1: 4, 2: 30}[r] for r in results])

    if score in [46, 47, 48]:
        # undo gacha
        for r in results:
            pool['remain'][['gold', 'silver', 'rainbow'][r]] += 1

        results = [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]
        random.shuffle(results)

        # redo gacha
        for r in results:
            pool['remain'][['gold', 'silver', 'rainbow'][r]] -= 1

    return results

def gacha():
    chances = pool['chance']
    p = [chances['gold'], chances['silver'], chances['rainbow']]
    result = np.random.choice(['gold', 'silver', 'rainbow'], p=p)

    if pool['remain'][result] == 0: # invalid gacha
        return gacha()
    
    pool['remain'][result] -= 1
    return ['gold', 'silver', 'rainbow'].index(result)

@app.route("/gacha_single/", methods=['POST'])
def gacha_single():
    return {
        'result': gacha()
    }

@app.route("/gacha_ten/", methods=['POST'])
def gacha_ten():
    return {
        'result': snap49([gacha() for _ in range(11)])
    }

@app.route("/remain_gold", methods=['GET'])
def remain_gold():
    return '{}'.format(pool['remain']['gold'])

@app.route("/remain_silver", methods=['GET'])
def remain_silver():
    return '{}'.format(pool['remain']['silver'])

@app.route("/remain_rainbow", methods=['GET'])
def remain_rainbow():
    return '{}'.format(pool['remain']['rainbow'])

@app.route('/')
def main():
    return app.send_static_file('index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('./static/js', path)

if __name__ == '__main__':
    app.run('0.0.0.0', port=8999)