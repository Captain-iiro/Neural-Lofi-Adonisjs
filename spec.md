# Neural_Lofi - Spécifications Fonctionnelles

> Générateur de musique Lo-Fi propulsé par l'Intelligence Artificielle

---

## 🎯 Vision du Projet

**Neural_Lofi** est une application web permettant de générer des morceaux de musique Lo-Fi personnalisés grâce à l'IA. L'utilisateur peut sélectionner un style musical, ajouter des textures sonores, et obtenir une composition unique parfaite pour la concentration, l'étude ou la relaxation.

---

## 🏗️ Architecture Simplifiée — Sans Base de Données

### Philosophie

Neural_Lofi adopte une architecture **stateless** et **sans base de données**. Cette approche minimaliste présente plusieurs avantages :

- ✅ **Simplicité** : Pas de configuration de BDD, pas de migrations
- ✅ **Portabilité** : L'application se déploie facilement
- ✅ **Performance** : Pas de requêtes SQL, lecture directe du filesystem
- ✅ **Maintenance** : Moins de dépendances = moins de points de défaillance

### Persistance via le Système de Fichiers

Au lieu d'utiliser une base de données pour stocker les métadonnées des morceaux, l'application utilise le **système de fichiers comme source de vérité**.

#### Comment ça fonctionne ?

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE FICHIERS                          │
│                                                                 │
│   public/generated/music/                                       │
│   ├── a1b2c3d4_classic_v1.mp3   ← Fichier = Donnée             │
│   ├── a1b2c3d4_classic_v2.mp3                                  │
│   ├── x7y8z9w0_indian_v1.mp3                                   │
│   └── x7y8z9w0_asian_v2.mp3                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCAN DU RÉPERTOIRE                           │
│                                                                 │
│   Pour chaque fichier .mp3 trouvé :                            │
│                                                                 │
│   1. Nom du fichier      →  {taskId}_{style}_v{version}.mp3    │
│   2. Task ID             →  Extrait du nom (1ère partie)       │
│   3. Style               →  Extrait du nom (2ème partie)       │
│   4. Version             →  Extrait du nom (v1 ou v2)          │
│   5. Date de création    →  Métadonnée filesystem (mtime)      │
│   6. Taille              →  Métadonnée filesystem (size)       │
│   7. URL publique        →  Chemin relatif calculé             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RÉPONSE API /api/library                     │
│                                                                 │
│   [                                                             │
│     {                                                           │
│       "filename": "a1b2c3d4_classic_v1.mp3",                   │
│       "url": "/generated/music/a1b2c3d4_classic_v1.mp3",       │
│       "taskId": "a1b2c3d4",                                    │
│       "style": "classic",                                       │
│       "version": "1",                                           │
│       "date": "2025-12-05 14:30",                              │
│       "size": "3.2 MB",                                         │
│       "title": "Classic Lo-Fi #a1b2c3d4 (v1)"                  │
│     },                                                          │
│     ...                                                         │
│   ]                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Convention de Nommage

Le nom de fichier encode toutes les informations nécessaires :

```
{taskId}_{style}_v{version}.mp3
   │        │        │
   │        │        └── Version du morceau (1 ou 2)
   │        │
   │        └── Style musical (classic, indian, african, asian, latino)
   │
   └── Identifiant unique retourné par MusicGPT (UUID raccourci)
```

**Styles encodés dans le nom de fichier :**

| Style UI | Code fichier |
|----------|--------------|
| Lofi Hip Hop | `classic` |
| Indian Lofi | `indian` |
| African Lofi | `african` |
| Asian Lofi | `asian` |
| Latino Lofi | `latino` |

**Exemples :**
- `a1b2c3d4_classic_v1.mp3` → Lo-Fi Hip Hop classique, version 1
- `x7y8z9w0_indian_v2.mp3` → Indian Lo-Fi, version 2
- `p9q8r7s6_asian_v1.mp3` → Asian Lo-Fi, version 1

#### Avantages de cette approche

| Aspect | Base de données | Système de fichiers |
|--------|-----------------|---------------------|
| Stockage des fichiers | Séparé (BDD + disque) | Unifié (disque seul) |
| Suppression | DELETE SQL + unlink | Simple unlink |
| Backup | Export BDD + fichiers | Copie du dossier |
| Synchronisation | Risque de désync | Toujours cohérent |
| Complexité | Élevée | Faible |

#### Limitations acceptées (MVP)

- ❌ Pas de métadonnées personnalisées (titre custom, tags...)
- ❌ Pas d'historique des paramètres de génération
- ❌ Pas de système de recherche avancée
- ❌ Pas de relations entre entités (playlists, favoris...)

> 💡 Ces limitations sont acceptables pour un MVP. Une base de données pourra être introduite dans une version ultérieure si nécessaire.

---

## 🎵 Fonctionnalités Principales

### 1. Génération de Musique IA

L'application utilise **MusicGPT** pour la génération musicale. MusicGPT est un service d'IA capable de créer des compositions musicales à partir de prompts textuels.

#### Styles Disponibles

| Style | Description |
|-------|-------------|
| **Classic Lo-Fi** | Hip-hop Lo-Fi classique avec groove mellow et atmosphère nostalgique |
| **Indian Lo-Fi** | Mélodies spirituelles indiennes avec vibes méditatives orientales |
| **African Lo-Fi** | Afrobeats Lo-Fi avec grooves rythmiques et textures organiques |
| **Asian Lo-Fi** | Atmosphère zen avec mélodies paisibles orientales traditionnelles |
| **Latino Lo-Fi** | Bossa nova Lo-Fi avec rythmes tropicaux et vibes coucher de soleil |

#### Textures Sonores (Optionnelles)

L'utilisateur peut enrichir sa composition avec des ambiances :

- **Rain** — Sons de pluie ambiante
- **Vinyl** — Craquements de vinyle et saturation de bande
- **City** — Ambiance urbaine distante
- **Typing** — Sons doux de clavier

### 2. Suivi de Génération en Temps Réel

- Affichage d'un **ETA** (temps estimé) fourni par MusicGPT
- **Barre de progression** visuelle
- **Console de statut** avec messages système
- Polling automatique pour vérifier l'état de la génération

### 3. Bibliothèque de Morceaux

- Liste de tous les morceaux générés
- Tri par date (plus récent en premier)
- Informations affichées :
  - Titre du morceau
  - Style
  - Version (MusicGPT génère 2 versions par requête)
  - Date de création
- Téléchargement direct des fichiers MP3

### 4. Lecteur Audio Avancé

#### Contrôles de Lecture

- Play / Pause
- Piste précédente / suivante
- Barre de progression cliquable (seek)
- Contrôle du volume

#### Fonctionnalités Avancées

- **Crossfade automatique** : transition fluide de 3 secondes entre les pistes
- **Visualisation audio réactive** : l'arrière-plan réagit aux basses du morceau
- **Gestion de playlist** : lecture continue de la bibliothèque

---

## 🖥️ Interface Utilisateur

### Design

- Esthétique **cyberpunk / neural** sombre
- Typographie monospace (JetBrains Mono)
- Palette de couleurs :
  - Fond sombre avec nuances de violet/bleu
  - Accents lumineux (cyan, magenta)
- Animations fluides et réactives

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │              │    │                              │  │
│  │  PANNEAU     │    │      BIBLIOTHÈQUE            │  │
│  │  GÉNÉRATEUR  │    │      (Liste des tracks)      │  │
│  │              │    │                              │  │
│  │  - Styles    │    │                              │  │
│  │  - Textures  │    │                              │  │
│  │  - Bouton    │    │                              │  │
│  │  - Status    │    │                              │  │
│  │              │    │                              │  │
│  └──────────────┘    └──────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PLAYER BAR (fixe en bas)           │   │
│  │  [Info] [◀ ▶ ▶▶] [━━━━━━━━━━━━━━━━━━] [🔊]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Responsive Design

- **Mobile** : Panneau générateur accessible via bouton flottant
- **Desktop** : Layout deux colonnes avec panneau fixe

---

## 🔌 Intégration MusicGPT

### Workflow de Génération

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │      │   Serveur   │      │  MusicGPT   │
│   (Web)     │      │             │      │    API      │
└─────┬───────┘      └──────┬──────┘      └──────┬──────┘
      │                     │                     │
      │ 1. POST /generate   │                     │
      │ (style, textures)   │                     │
      │────────────────────>│                     │
      │                     │                     │
      │                     │ 2. Generate Request │
      │                     │ (prompt construit)  │
      │                     │────────────────────>│
      │                     │                     │
      │                     │ 3. Task ID + ETA    │
      │                     │<────────────────────│
      │                     │                     │
      │ 4. Task ID + ETA    │                     │
      │<────────────────────│                     │
      │                     │                     │
      │ 5. GET /status/{id} │                     │
      │ (polling)           │                     │
      │────────────────────>│                     │
      │                     │                     │
      │                     │ 6. Check Status     │
      │                     │────────────────────>│
      │                     │                     │
      │                     │ 7. Status/URLs      │
      │                     │<────────────────────│
      │                     │                     │
      │ 8. Status/Files     │                     │
      │<────────────────────│                     │
      │                     │                     │
```

### Prompts IA

Les prompts envoyés à MusicGPT sont construits dynamiquement :

```
[Base du style] + [Textures sélectionnées] + [Keywords] + [Use case]
```

**Exemple** : 
> "Chill LoFi hip-hop beat with mellow groove and nostalgic atmosphere with warm vinyl crackle and tape saturation, ambient rain sounds. Lofi, Chillhop, Calm, Vibe, Study Beats. Perfect for focus, studying, or relaxation."

### Paramètres MusicGPT

- `prompt` : Description textuelle de la musique souhaitée
- `musicStyle` : Style musical (ex: "Lo-fi Hip Hop", "Asian Lo-fi")
- `makeInstrumental` : `true` (pas de voix)

### Résultats

MusicGPT retourne **2 versions** de chaque morceau généré, permettant à l'utilisateur de choisir sa préférée.

---

## 📁 Stockage des Fichiers

> ⚠️ Rappel : L'application n'utilise **pas de base de données**. Le système de fichiers fait office de persistance. Voir la section "Architecture Simplifiée" pour plus de détails.

### Structure

```
public/
└── generated/
    └── music/                          ← Source de vérité pour la bibliothèque
        ├── a1b2c3d4_classic_v1.mp3
        ├── a1b2c3d4_classic_v2.mp3
        ├── x7y8z9w0_indian_v1.mp3
        └── ...
```

### Métadonnées (extraites dynamiquement)

À chaque appel de `/api/library`, le serveur scanne le dossier `music/` et extrait les informations suivantes **directement depuis le filesystem** :

| Donnée | Source |
|--------|--------|
| **Filename** | Nom du fichier |
| **URL** | Chemin calculé (`/generated/music/{filename}`) |
| **Task ID** | Extrait du nom de fichier (1ère partie avant `_`) |
| **Style** | Extrait du nom de fichier (2ème partie : `classic`, `indian`...) |
| **Version** | Extrait du nom de fichier (`v1` ou `v2`) |
| **Date** | Timestamp de modification du fichier (`mtime`) |
| **Taille** | Attribut `size` du fichier |
| **Titre** | Généré dynamiquement (`{Style} Lo-Fi #{taskId} (v{version})`) |

---

## 🚀 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/` | Page principale de l'application |
| `POST` | `/api/generate` | Lance une nouvelle génération |
| `GET` | `/api/status/{taskId}` | Vérifie le statut d'une génération |
| `GET` | `/api/library` | Liste tous les morceaux générés |

### Payloads

#### POST /api/generate

**Request :**
```json
{
  "style": "Lofi Hip Hop",
  "ambiance": "Relaxing",
  "sounds": ["Rain", "Vinyl"]
}
```

**Response :**
```json
{
  "taskId": "abc123-def456-...",
  "eta": 120
}
```

#### GET /api/status/{taskId}

**Réponses possibles :**

```json
// En cours
{
  "status": "processing",
  "progress": "Generating audio..."
}

// Terminé
{
  "status": "completed",
  "files": [
    { "url": "/generated/music/abc123_v1.mp3", "version": 1 },
    { "url": "/generated/music/abc123_v2.mp3", "version": 2 }
  ]
}

// Échec
{
  "status": "failed",
  "error": "Rate limit exceeded"
}
```

---

## ⚠️ Gestion des Erreurs

### Erreurs MusicGPT

| Type | Message | Action |
|------|---------|--------|
| **Authentication** | Erreur d'authentification API | Vérifier la clé API |
| **Payment Required** | Crédits insuffisants | Recharger le compte MusicGPT |
| **Rate Limit** | Trop de requêtes | Attendre `retry-after` secondes |
| **Timeout** | Génération trop longue | Réessayer plus tard |

### Affichage Utilisateur

Les erreurs sont affichées dans la console de statut avec un message explicite permettant à l'utilisateur de comprendre le problème.

## 📚 Technologies

- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Backend** : De votre choix (Symfony, Laravel, Express, etc.)
- **Base de données** : ❌ Aucune — Persistance via système de fichiers
- **IA Musicale** : MusicGPT API (via bundle `composer install yoanbernabeu/music-gpt-bundle` si avec Symfony, sinon à vous d'implémenter l'API vous même : https://musicgpt.com/api)
- **Audio** : Web Audio API (crossfade, visualisation)
- **Design** : Custom CSS (esthétique cyberpunk)

---

*Document de spécifications v1.0 — Neural_Lofi Generator*

