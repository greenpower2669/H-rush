#!/usr/bin/env python3
"""Fetch exact CC0 music from original OpenGameArt sources, verify Djipie SHA-256.
No access to private Djipie Releases or Github secrets is needed.
The audio is copied into the APK in CI, but not committed to H-rush Git history.
"""
import hashlib
import io
import pathlib
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/music/djipie'
HOST = 'https://opengameart.org/sites/default/files/'
# (original archive, original member, published local filename, Djipie CC0 SHA256)
TRACKS = [
    ('space_echo.ogg', None, 'space_echo.ogg', '331fa9ceb811a33a31819652c9c22296879c199e1ebe407822ee7b1399b959be'),
    ('action.zip', 'Action_A.mp3', 'action_a.mp3', 'da310ec92e391453de4b2f43f0895b747e945d1a526ef81c4b5d7f0d8bb5c182'),
    ('battle.zip', 'Battle.mp3', 'battle.mp3', 'caca3fd48ca8e23b554eeb7e0224fd28f350605a137241c91076f6b8250b03f8'),
    ('horror.zip', 'Horror.mp3', 'horror.mp3', '5ff6a836f7430504e7553a56bd4f49c692b7a3f7db2ca0eb9281c5ee37d54fa5'),
]

def fetch(name):
    req = urllib.request.Request(HOST + name, headers={'User-Agent':'AshRushGame/0.4.2 (CC0 provenance validation)'})
    with urllib.request.urlopen(req, timeout=90) as response:
        return response.read()

def extract(raw, member):
    if member is None:
        return raw
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        matches = [n for n in archive.namelist() if pathlib.PurePosixPath(n).name.casefold() == member.casefold()]
        if len(matches) != 1:
            raise ValueError('Ambiguous/missing archive member ' + member)
        return archive.read(matches[0])

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cache = {}
    for archive, member, filename, expected in TRACKS:
        target = OUT / filename
        if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == expected:
            print('VALID CACHED', filename, target.stat().st_size)
            continue
        if archive not in cache:
            cache[archive] = fetch(archive)
        data = extract(cache[archive], member)
        actual = hashlib.sha256(data).hexdigest()
        if actual != expected:
            raise ValueError(f'SHA-256 mismatch {filename}: {actual}, expected Djipie {expected}')
        target.write_bytes(data)
        print('VERIFIED CC0', filename, len(data), actual)
    print('DJIPIE CC0 MUSIC VERIFIED:', len(TRACKS))

if __name__ == '__main__':
    main()
