# 🐳 Guide Docker - Projet Caching

Ce guide explique comment lancer tout le projet avec Docker, sans avoir besoin d'installer les dépendances localement.

## 📋 Prérequis

- Docker Desktop installé
- Docker Compose installé (inclus avec Docker Desktop)

## 🚀 Démarrage Rapide

### 1. Créer le fichier `.env`

Copiez le fichier `.env.example` et créez `.env` à la racine du projet:

```bash
cp .env.example .env
```

Modifiez les valeurs si nécessaire (mots de passe, etc.)

### 2. Lancer tous les services

```bash
docker-compose up -d --build
```

Cette commande va:
- ✅ Construire les images Docker (Backend Go + Frontend React)
- ✅ Démarrer MySQL, Redis, Backend et Frontend
- ✅ Installer toutes les dépendances automatiquement

### 3. Accéder à l'application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **MySQL:** localhost:3305
- **Redis:** localhost:6379

## 📁 Structure Docker

```
Caching/
├── docker-compose.yml          # Orchestration de tous les services
├── .env                        # Variables d'environnement
├── Backend/
│   ├── Dockerfile              # Image Docker pour le backend Go
│   └── docker-compose.yml     # (ancien, peut être supprimé)
└── Frontend/
    ├── Dockerfile              # Image Docker pour le frontend React
    ├── nginx.conf              # Configuration Nginx
    └── .dockerignore            # Fichiers à ignorer
```

## 🔧 Commandes Utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Arrêter les services
```bash
docker-compose down
```

### Redémarrer un service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Reconstruire les images
```bash
docker-compose up -d --build
```

### Voir les conteneurs en cours
```bash
docker-compose ps
```

### Accéder au shell d'un conteneur
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

## 🏗️ Architecture Docker

```
┌─────────────────────────────────────────┐
│         Docker Network (app_net)         │
│                                         │
│  ┌──────────┐      ┌──────────┐        │
│  │ Frontend │─────▶│ Backend  │        │
│  │ (Nginx)  │      │   (Go)   │        │
│  │ :3000    │      │  :8080   │        │
│  └──────────┘      └────┬─────┘        │
│                         │              │
│                    ┌────▼─────┐        │
│                    │  Redis   │        │
│                    │  :6379   │        │
│                    └──────────┘        │
│                         │              │
│                    ┌────▼─────┐        │
│                    │  MySQL   │        │
│                    │  :3306   │        │
│                    └──────────┘        │
└─────────────────────────────────────────┘
```

## 🔍 Détails des Services

### Backend (Go)
- **Port:** 8080
- **Image:** Construite depuis `Backend/Dockerfile`
- **Dépendances:** MySQL, Redis
- **Hot Reload:** Utilise Air pour le rechargement automatique

### Frontend (React)
- **Port:** 3000 (mappé vers 80 dans le conteneur)
- **Image:** Construite depuis `Frontend/Dockerfile`
- **Serveur:** Nginx (production-ready)
- **Build:** Vite build dans l'image Docker

### Redis
- **Port:** 6379
- **Image:** `redis:alpine`
- **Volume:** Persistance des données

### MySQL
- **Port:** 3305 (externe) → 3306 (interne)
- **Image:** `mysql:8.0`
- **Volume:** Persistance des données
- **Healthcheck:** Vérifie que MySQL est prêt avant de démarrer le backend

## 🐛 Dépannage

### Le frontend ne se connecte pas au backend

Vérifiez que `VITE_API_URL` dans `docker-compose.yml` pointe vers:
- `http://localhost:8080/api` (si accès depuis le navigateur)
- `http://backend:8080/api` (si accès depuis le conteneur frontend)

**Solution:** Modifiez `docker-compose.yml`:
```yaml
frontend:
  environment:
    - VITE_API_URL=http://backend:8080/api
```

Puis reconstruisez:
```bash
docker-compose up -d --build frontend
```

### Les ports sont déjà utilisés

Si les ports 3000, 8080, 3305 ou 6379 sont déjà utilisés, modifiez-les dans `docker-compose.yml`:

```yaml
ports:
  - "3001:80"  # Frontend sur port 3001
  - "8081:8080"  # Backend sur port 8081
```

### Erreur de build

Si le build échoue, nettoyez les images et reconstruisez:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Voir les logs d'erreur

```bash
docker-compose logs backend
docker-compose logs frontend
```

## 📝 Notes Importantes

1. **Premier démarrage:** Le backend attend que MySQL soit prêt (healthcheck)
2. **Variables d'environnement:** Toutes dans `.env` à la racine
3. **Volumes:** Les données MySQL et Redis sont persistantes
4. **Hot Reload:** Le backend utilise Air pour le rechargement automatique
5. **Production:** Le frontend est servi par Nginx (optimisé)

## 🎯 Avantages de Docker

✅ **Pas besoin d'installer:**
- Node.js / npm
- Go
- MySQL
- Redis

✅ **Environnement identique:**
- Même version de toutes les dépendances
- Fonctionne sur Windows, Mac, Linux

✅ **Isolation:**
- Chaque service dans son propre conteneur
- Pas de conflits de ports

✅ **Facilité de déploiement:**
- Un seul `docker-compose up` pour tout lancer

## 🚀 Pour les autres développeurs

1. Cloner le repo
2. Créer `.env` depuis `.env.example`
3. Lancer `docker-compose up -d --build`
4. C'est tout ! 🎉

