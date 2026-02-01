import requests
import time
import os
from PIL import Image
import io
import json

# Liste des 66 animes (titre exact pour la recherche)
animes = [
    "One Piece",
    "Naruto",
    "Death Note",
    "Attack on Titan",
    "Dragon Ball Z",
    "My Hero Academia",
    "Demon Slayer",
    "Fullmetal Alchemist Brotherhood",
    "Sword Art Online",
    "Tokyo Ghoul",
    "Hunter x Hunter 2011",
    "Bleach",
    "Jujutsu Kaisen",
    "Spy x Family",
    "Chainsaw Man",
    "One Punch Man",
    "Steins Gate",
    "Code Geass",
    "Cowboy Bebop",
    "Neon Genesis Evangelion",
    "Mob Psycho 100",
    "Violet Evergarden",
    "Your Name",
    "Spirited Away",
    "Akira",
    "Ghost in the Shell",
    "Toradora",
    "Re:Zero",
    "The Promised Neverland",
    "Haikyuu",
    "Made in Abyss",
    "Vinland Saga",
    "Parasyte",
    "Erased",
    "Psycho-Pass",
    "Fate/Zero",
    "Bakemonogatari",
    "March Comes in Like a Lion",
    "A Silent Voice",
    "Anohana",
    "Terror in Resonance",
    "Ping Pong the Animation",
    "Mushishi",
    "Baccano",
    "Durarara",
    "Kill la Kill",
    "Gurren Lagann",
    "FLCL",
    "Beck",
    "Space Dandy",
    "Serial Experiments Lain",
    "Texhnolyze",
    "Haibane Renmei",
    "Kaiba",
    "Paranoia Agent",
    "Boogiepop Phantom",
    "Mononoke",
    "Tatami Galaxy",
    "Shouwa Genroku Rakugo Shinjuu",
    "Kyousougiga",
    "Kemono no Souja Erin",
    "Casshern Sins",
    "Gankutsuou",
    "Kemonozume",
    "Mind Game",
    "Angel's Egg"
]

# Créer les dossiers nécessaires
os.makedirs('assets/posters', exist_ok=True)
os.makedirs('assets/posters/full', exist_ok=True)
os.makedirs('assets/posters/thumb', exist_ok=True)

# Headers pour éviter le blocage
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Fonction pour nettoyer le nom de fichier
def sanitize_filename(name):
    """Convertir le titre en nom de fichier valide"""
    return name.lower().replace(' ', '-').replace('/', '-').replace(':', '').replace('!', '').replace("'", '')

# Fonction de téléchargement et optimisation
def download_and_optimize_poster(index, anime_name):
    """
    Télécharge l'affiche depuis Jikan API (MyAnimeList)
    et crée 2 versions optimisées (full + thumbnail)
    """
    try:
        print(f"\n[{index}/66] Recherche : {anime_name}...")
        
        # 1. Rechercher l'anime sur Jikan API
        search_url = f"https://api.jikan.moe/v4/anime?q={anime_name}&limit=1"
        response = requests.get(search_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erreur API ({response.status_code}) pour {anime_name}")
            return False
        
        data = response.json()
        
        if not data.get('data') or len(data['data']) == 0:
            print(f"❌ Aucun résultat pour {anime_name}")
            return False
        
        # 2. Récupérer l'URL de l'affiche
        anime_info = data['data'][0]
        poster_url = anime_info['images']['jpg']['large_image_url']
        found_title = anime_info['title']
        
        print(f"   Trouvé : {found_title}")
        print(f"   URL : {poster_url}")
        
        # 3. Télécharger l'image
        img_response = requests.get(poster_url, headers=headers, timeout=15)
        if img_response.status_code != 200:
            print(f"❌ Impossible de télécharger l'image")
            return False
        
        # 4. Ouvrir l'image avec Pillow
        img = Image.open(io.BytesIO(img_response.content))
        
        # Convertir en RGB si nécessaire (pour WebP)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # 5. Créer le nom de fichier
        filename_base = f"{index:02d}-{sanitize_filename(anime_name)}"
        
        # 6. Sauvegarder version FULL (800x1200 max, qualité 90)
        img_full = img.copy()
        img_full.thumbnail((800, 1200), Image.Resampling.LANCZOS)
        full_path = f"assets/posters/full/{filename_base}.webp"
        img_full.save(full_path, 'WEBP', quality=90, method=6)
        
        # 7. Sauvegarder version THUMBNAIL (200x300, qualité 85)
        img_thumb = img.copy()
        img_thumb.thumbnail((200, 300), Image.Resampling.LANCZOS)
        thumb_path = f"assets/posters/thumb/{filename_base}.webp"
        img_thumb.save(thumb_path, 'WEBP', quality=85, method=6)
        
        # 8. Copier la version thumb dans le dossier principal (pour simplifier)
        main_path = f"assets/posters/{filename_base}.webp"
        img_thumb.save(main_path, 'WEBP', quality=85, method=6)
        
        full_size = os.path.getsize(full_path) / 1024
        thumb_size = os.path.getsize(thumb_path) / 1024
        
        print(f"   ✅ Sauvegardé !")
        print(f"   - Full: {full_size:.1f} Ko")
        print(f"   - Thumb: {thumb_size:.1f} Ko")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur pour {anime_name}: {str(e)}")
        return False

# Fonction principale
def main():
    print("=" * 60)
    print("TÉLÉCHARGEMENT DES AFFICHES ANIME")
    print("=" * 60)
    
    success_count = 0
    failed = []
    
    for index, anime in enumerate(animes, start=1):
        success = download_and_optimize_poster(index, anime)
        
        if success:
            success_count += 1
        else:
            failed.append((index, anime))
        
        # IMPORTANT : Rate limiting (Jikan API limite à 3 req/sec, 60 req/min)
        # On attend 1 seconde entre chaque requête pour être safe
        if index < len(animes):
            print("   ⏳ Pause 1s (rate limiting)...")
            time.sleep(1)
    
    # Résumé final
    print("\n" + "=" * 60)
    print("RÉSUMÉ")
    print("=" * 60)
    print(f"✅ Réussis : {success_count}/66")
    print(f"❌ Échoués : {len(failed)}/66")
    
    if failed:
        print("\n⚠️  Animes non téléchargés :")
        for idx, name in failed:
            print(f"   #{idx} - {name}")
        print("\n💡 Conseil : Relance le script ou télécharge-les manuellement")
    else:
        print("\n🎉 TOUS LES POSTERS ONT ÉTÉ TÉLÉCHARGÉS !")
    
    # Sauvegarder un fichier de log
    with open('download_log.json', 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(animes),
            'success': success_count,
            'failed': [{'index': idx, 'name': name} for idx, name in failed]
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n📝 Log sauvegardé dans 'download_log.json'")

if __name__ == "__main__":
    main()
