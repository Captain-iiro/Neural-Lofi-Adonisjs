# 🎵 Neural_Lofi — Solution avec AdonisJS 6 et Edge

> **Mon implémentation du challenge DevChallenges pour créer un générateur de musique Lo-Fi propulsé par l'Intelligence Artificielle.**

[![DevChallenges](https://img.shields.io/badge/DevChallenges-WEEK--49-blueviolet?style=for-the-badge)](https://devchallenges.yoandev.co/)
[![Niveau](https://img.shields.io/badge/Niveau-Difficile-red?style=for-the-badge)]()
[![Stack](https://img.shields.io/badge/Stack-AdonisJS_v6_&_Edge-5A46C4?style=for-the-badge&logo=adonisjs)]()

---

## ✨ Aperçu du Projet

Ce projet est une solution complète au challenge **Neural_Lofi** de DevChallenges. J'ai choisi d'utiliser le framework **AdonisJS v6**.

---

## 🎯 Fonctionnalités Implémentées

L'application respecte strictement les spécifications fonctionnelles ( [`spec.md`](./spec.md) ) et propose :

- **🎵 Génération Musicale :**
  - Interface pour choisir parmi les **5 styles musicaux** (Classic, Indian, African, Asian, Latino).
  - Option d'ajouter jusqu'à **4 textures sonores** (Rain, Vinyl, City, Typing).
  - **Suivi en temps réel** de la génération via un mécanisme de _polling_ du statut de MusicGPT pour une bonne UX.
- **📚 Bibliothèque Dynamique :**
  - Scan du système de fichiers pour lister les morceaux générés.
  - Affichage dynamique de la librairie des morceaux.
- **▶️ Lecteur Audio Avancé :**
  - Lecture des morceaux avec un lecteur personnalisé.
  - Implémentation du **crossfade** pour une transition fluide entre les morceaux.
  - Intégration d'une **visualisation sonore** (via Web Audio API) pour le rendu cyberpunk.

---

## 🛠️ Installation et Démarrage

Suivez ces étapes pour démarrer le projet en local.

### 1. Prérequis

Assurez-vous d'avoir installé :

- **Node.js** (version 20 ou supérieure recommandée)
- Un compte **MusicGPT** avec une clé API valide.

### 2. Configuration

Clonez le dépôt et installez les dépendances :

```bash
git clone <URL_DE_VOTRE_PROJET>
cd Neural_Lofi-Adonisjs
npm install
```

### 3. Variables d'Environnement

Créez un fichier .env à la racine du projet et ajoutez votre clé API MusicGPT :

```bash
# ... autres variables AdonisJS ...

MUSIC_GPT_API_KEY="VOTRE_CLE_MUSICGPT_ICI"
# Le répertoire où les fichiers .mp3 et .json seront stockés
MUSIC_STORAGE_PATH="app/music_library"
```

### 4. Démarrage

Démarrez le serveur de développement AdonisJS :
```bash
npm run dev
```