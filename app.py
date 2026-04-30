from flask import Flask, render_template, jsonify
import csv
import os
import glob

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')


def get_songs():
    files = sorted(glob.glob(os.path.join(DATA_DIR, '*.csv')))
    return [{'id': i + 1, 'file': f} for i, f in enumerate(files)]


def get_lyrics(song_id):
    songs = get_songs()
    if song_id < 1 or song_id > len(songs):
        return None
    filepath = songs[song_id - 1]['file']
    words = []
    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if row and row[0].strip():
                words.append({'number': i + 1, 'word': row[0].strip()})
    return words


@app.route('/')
def index():
    songs = get_songs()
    return render_template('index.html', song_count=len(songs))


@app.route('/api/lyrics/<int:song_id>')
def api_lyrics(song_id):
    words = get_lyrics(song_id)
    if words is None:
        return jsonify({'error': 'Hittades inte'}), 404
    return jsonify({'words': words, 'count': len(words)})


if __name__ == '__main__':
    app.run(debug=True)
