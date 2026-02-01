import os
import json

# Lister les fichiers réels
real_files = sorted([f for f in os.listdir('assets/posters/') if f.endswith('.webp')])

print(f"Nombre de fichiers trouvés : {len(real_files)}\n")

# Template avec les 66 animes
anime_list = [
    {"id": 1, "title": "One Piece", "synonyms": ["one piece", "op", "onepiece"]},
    {"id": 2, "title": "Naruto", "synonyms": ["naruto", "naruto shippuden", "shippuden"]},
    {"id": 3, "title": "Death Note", "synonyms": ["death note", "deathnote", "dn"]},
    {"id": 4, "title": "Attack on Titan", "synonyms": ["attack on titan", "aot", "shingeki no kyojin", "snk"]},
    {"id": 5, "title": "Dragon Ball Z", "synonyms": ["dragon ball z", "dbz", "dragon ball"]},
    {"id": 6, "title": "My Hero Academia", "synonyms": ["my hero academia", "mha", "boku no hero"]},
    {"id": 7, "title": "Demon Slayer", "synonyms": ["demon slayer", "kimetsu no yaiba", "kny"]},
    {"id": 8, "title": "Fullmetal Alchemist", "synonyms": ["fullmetal alchemist", "fma", "fmab"]},
    {"id": 9, "title": "Sword Art Online", "synonyms": ["sword art online", "sao"]},
    {"id": 10, "title": "Tokyo Ghoul", "synonyms": ["tokyo ghoul", "tg"]},
    {"id": 11, "title": "Hunter x Hunter", "synonyms": ["hunter x hunter", "hxh"]},
    {"id": 12, "title": "Bleach", "synonyms": ["bleach"]},
    {"id": 13, "title": "Jujutsu Kaisen", "synonyms": ["jujutsu kaisen", "jjk"]},
    {"id": 14, "title": "Spy x Family", "synonyms": ["spy x family", "spy family"]},
    {"id": 15, "title": "Chainsaw Man", "synonyms": ["chainsaw man", "csm"]},
    {"id": 16, "title": "One Punch Man", "synonyms": ["one punch man", "opm"]},
    {"id": 17, "title": "Steins;Gate", "synonyms": ["steins gate", "steins;gate"]},
    {"id": 18, "title": "Code Geass", "synonyms": ["code geass"]},
    {"id": 19, "title": "Cowboy Bebop", "synonyms": ["cowboy bebop", "bebop"]},
    {"id": 20, "title": "Neon Genesis Evangelion", "synonyms": ["evangelion", "nge", "eva"]},
    {"id": 21, "title": "Mob Psycho 100", "synonyms": ["mob psycho 100", "mob psycho"]},
    {"id": 22, "title": "Violet Evergarden", "synonyms": ["violet evergarden"]},
    {"id": 23, "title": "Your Name", "synonyms": ["your name", "kimi no na wa"]},
    {"id": 24, "title": "Spirited Away", "synonyms": ["spirited away", "chihiro"]},
    {"id": 25, "title": "Akira", "synonyms": ["akira"]},
    {"id": 26, "title": "Ghost in the Shell", "synonyms": ["ghost in the shell", "gits"]},
    {"id": 27, "title": "Toradora", "synonyms": ["toradora"]},
    {"id": 28, "title": "Re:Zero", "synonyms": ["re zero", "rezero"]},
    {"id": 29, "title": "The Promised Neverland", "synonyms": ["promised neverland", "tpn"]},
    {"id": 30, "title": "Haikyuu", "synonyms": ["haikyuu", "haikyu"]},
    {"id": 31, "title": "Made in Abyss", "synonyms": ["made in abyss", "mia"]},
    {"id": 32, "title": "Vinland Saga", "synonyms": ["vinland saga"]},
    {"id": 33, "title": "Parasyte", "synonyms": ["parasyte", "kiseijuu"]},
    {"id": 34, "title": "Erased", "synonyms": ["erased", "boku dake ga inai machi"]},
    {"id": 35, "title": "Psycho-Pass", "synonyms": ["psycho pass", "psychopass"]},
    {"id": 36, "title": "Fate/Zero", "synonyms": ["fate zero", "fate/zero"]},
    {"id": 37, "title": "Monogatari Series", "synonyms": ["monogatari", "bakemonogatari"]},
    {"id": 38, "title": "March Comes in Like a Lion", "synonyms": ["march comes in like a lion", "sangatsu"]},
    {"id": 39, "title": "A Silent Voice", "synonyms": ["silent voice", "koe no katachi"]},
    {"id": 40, "title": "Anohana", "synonyms": ["anohana"]},
    {"id": 41, "title": "Terror in Resonance", "synonyms": ["terror in resonance", "zankyou no terror"]},
    {"id": 42, "title": "Ping Pong the Animation", "synonyms": ["ping pong"]},
    {"id": 43, "title": "Mushishi", "synonyms": ["mushishi"]},
    {"id": 44, "title": "Baccano", "synonyms": ["baccano"]},
    {"id": 45, "title": "Durarara", "synonyms": ["durarara", "drrr"]},
    {"id": 46, "title": "Kill la Kill", "synonyms": ["kill la kill"]},
    {"id": 47, "title": "Gurren Lagann", "synonyms": ["gurren lagann", "ttgl"]},
    {"id": 48, "title": "FLCL", "synonyms": ["flcl", "fooly cooly"]},
    {"id": 49, "title": "Beck", "synonyms": ["beck"]},
    {"id": 50, "title": "Space Dandy", "synonyms": ["space dandy"]},
    {"id": 51, "title": "Serial Experiments Lain", "synonyms": ["lain", "serial experiments lain"]},
    {"id": 52, "title": "Texhnolyze", "synonyms": ["texhnolyze"]},
    {"id": 53, "title": "Haibane Renmei", "synonyms": ["haibane renmei", "haibane"]},
    {"id": 54, "title": "Kaiba", "synonyms": ["kaiba"]},
    {"id": 55, "title": "Paranoia Agent", "synonyms": ["paranoia agent"]},
    {"id": 56, "title": "Boogiepop Phantom", "synonyms": ["boogiepop"]},
    {"id": 57, "title": "Mononoke", "synonyms": ["mononoke"]},
    {"id": 58, "title": "Tatami Galaxy", "synonyms": ["tatami galaxy"]},
    {"id": 59, "title": "Shouwa Genroku Rakugo Shinjuu", "synonyms": ["rakugo"]},
    {"id": 60, "title": "Kyousougiga", "synonyms": ["kyousougiga"]},
    {"id": 61, "title": "Kemono no Souja Erin", "synonyms": ["erin"]},
    {"id": 62, "title": "Casshern Sins", "synonyms": ["casshern sins"]},
    {"id": 63, "title": "Gankutsuou", "synonyms": ["gankutsuou"]},
    {"id": 64, "title": "Kemonozume", "synonyms": ["kemonozume"]},
    {"id": 65, "title": "Mind Game", "synonyms": ["mind game"]},
    {"id": 66, "title": "Angel's Egg", "synonyms": ["angel's egg", "angels egg"]},
]

# Associer chaque anime au fichier réel
output = "const animeData = [\n"

for i, (anime, filename) in enumerate(zip(anime_list, real_files), 1):
    syn_str = '", "'.join(anime['synonyms'])
    difficulty = "easy" if i <= 30 else ("medium" if i <= 50 else "hard")
    
    output += f'  {{ id: {i}, title: "{anime["title"]}", synonyms: ["{syn_str}"], poster: "{filename}", difficulty: "{difficulty}" }},\n'
    
    print(f'{i:2d}. {anime["title"]:<35} → {filename}')

output += "];"

# Sauvegarder
with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"\n✅ Fichier js/data.js généré avec {len(real_files)} animes")
