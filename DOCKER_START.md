# 🚀 Démarrage Rapide avec Docker

## Étapes pour lancer le projet

### 1. Créer le fichier `.env`

À la racine du projet, créez un fichier `.env` avec ce contenu:

```env
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=cache_db
JWT_SECRET=your-super-secret-jwt-key-change-this
VITE_API_URL=http://localhost:8080/api
```

Ou copiez depuis `env.example`:
```bash
cp env.example .env
```

### 2. Lancer tous les services

```bash
docker-compose up -d --build
```

Cette commande va:
- ✅ Construire les images (Backend + Frontend)
- ✅ Installer toutes les dépendances (Node.js, Go, etc.)
- ✅ Démarrer MySQL, Redis, Backend et Frontend

### 3. Accéder à l'application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api

### 4. Vérifier que tout fonctionne

```bash
# Voir les logs
docker-compose logs -f

# Voir les conteneurs
docker-compose ps
```

## Commandes utiles

```bash
# Arrêter
docker-compose down

# Redémarrer
docker-compose restart

# Reconstruire
docker-compose up -d --build

# Voir les logs d'un service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## ✅ Avantages

- ✅ Pas besoin d'installer Node.js, Go, MySQL, Redis
- ✅ Fonctionne sur Windows, Mac, Linux
- ✅ Environnement identique pour tous
- ✅ Un seul commande pour tout lancer

## 🐛 Problèmes?

Voir `README_DOCKER.md` pour plus de détails et dépannage.

