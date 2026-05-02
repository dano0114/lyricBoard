from flask import Flask, render_template, jsonify
import csv
import io
import os
import glob
import time

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
GITHUB_REPO = os.environ.get('GITHUB_REPO')
GITHUB_BRANCH = os.environ.get('GITHUB_BRANCH', 'main')
CACHE_TTL = int(os.environ.get('CACHE_TTL', 60))

_cache = {'songs': None, 'lyrics': {}, 'fetched_at': 0}


def _github_songs():
    import requests
    url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/data?ref={GITHUB_BRANCH}'
    r = requests.get(url, timeout=5)
    r.raise_for_status()
    files = sorted((f for f in r.json() if f['name'].endswith('.csv')), key=lambda f: f['name'])
    return [{'id': i + 1, 'name': f['name'], 'download_url': f['download_url']}
            for i, f in enumerate(files)]


def _raw_rows(source):
    return [row[0].strip() for row in csv.reader(source) if row and row[0].strip()]


def get_songs():
    if not GITHUB_REPO:
        files = sorted(glob.glob(os.path.join(DATA_DIR, '*.csv')))
        return [{'id': i + 1, 'file': f} for i, f in enumerate(files)]

    now = time.time()
    if _cache['songs'] is None or now - _cache['fetched_at'] > CACHE_TTL:
        _cache['songs'] = _github_songs()
        _cache['lyrics'] = {}
        _cache['fetched_at'] = now
    return _cache['songs']


def get_lyrics(song_id):
    songs = get_songs()
    if song_id < 1 or song_id > len(songs):
        return None, None

    if not GITHUB_REPO:
        with open(songs[song_id - 1]['file'], newline='', encoding='utf-8') as f:
            rows = _raw_rows(f)
    else:
        if song_id not in _cache['lyrics']:
            import requests
            r = requests.get(songs[song_id - 1]['download_url'], timeout=5)
            r.raise_for_status()
            _cache['lyrics'][song_id] = _raw_rows(io.StringIO(r.text))
        rows = _cache['lyrics'][song_id]

    if not rows:
        return None, None
    title = rows[0]
    words = [{'number': i, 'word': w} for i, w in enumerate(rows[1:], 1)]
    return title, words


@app.route('/')
def index():
    songs = get_songs()
    return render_template('index.html', song_count=len(songs))


@app.route('/api/lyrics/<int:song_id>')
def api_lyrics(song_id):
    title, words = get_lyrics(song_id)
    if words is None:
        return jsonify({'error': 'Hittades inte'}), 404
    return jsonify({'words': words, 'count': len(words), 'title': title})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
