# 📤 Guide pour pousser les modifications vers GitHub

## Étapes pour pousser vos modifications

### 1. Ajouter tous les fichiers modifiés et nouveaux

```bash
git add .
```

Cette commande ajoute:
- ✅ Fichiers modifiés (Backend/pkg/db/dbconnect.go, Frontend/src/lib/api.ts)
- ✅ Nouveaux fichiers Docker (Dockerfile, docker-compose.yml, nginx.conf, etc.)
- ✅ Documentation (README_DOCKER.md, DOCKER_START.md, etc.)

### 2. Vérifier ce qui sera commité

```bash
git status
```

Vous devriez voir tous les fichiers en vert (staged).

### 3. Créer un commit avec un message descriptif

```bash
git commit -m "Add Docker support and fix database connection

- Add Docker configuration for frontend and backend
- Add docker-compose.yml for full stack orchestration
- Fix database connection with retry logic
- Add Nginx reverse proxy configuration
- Add Docker documentation (README_DOCKER.md, DOCKER_START.md)
- Update API configuration for Docker environment"
```

### 4. Pousser vers GitHub

```bash
git push origin main
```

Si c'est la première fois, GitHub peut demander vos identifiants.

---

## ⚠️ Note importante sur le fichier .env

Le fichier `.env` contient des secrets (mots de passe, clés JWT). **NE PAS** le pousser sur GitHub !

Vérifiez que `.gitignore` contient `.env`. Si ce n'est pas le cas:

```bash
# Ajouter .env au .gitignore
echo ".env" >> .gitignore

# Retirer .env du staging si déjà ajouté
git reset HEAD .env
```

---

## 📋 Commandes complètes (copier-coller)

```bash
# 1. Aller dans le dossier du projet
cd C:\Users\PC\Desktop\Caching

# 2. Vérifier que .env n'est pas tracké
git check-ignore .env || echo ".env" >> .gitignore

# 3. Retirer .env du staging si nécessaire
git reset HEAD .env 2>$null

# 4. Ajouter tous les fichiers (sauf .env qui est dans .gitignore)
git add .

# 5. Vérifier
git status

# 6. Commit
git commit -m "Add Docker support and fix database connection

- Add Docker configuration for frontend and backend
- Add docker-compose.yml for full stack orchestration
- Fix database connection with retry logic
- Add Nginx reverse proxy configuration
- Add Docker documentation"

# 7. Push vers GitHub
git push origin main
```

---

## 🔍 Si vous avez des erreurs

### Erreur: "Authentication failed"

GitHub ne permet plus les mots de passe. Utilisez un **Personal Access Token**:

1. Allez sur: https://github.com/settings/tokens
2. Cliquez "Generate new token (classic)"
3. Donnez-lui un nom (ex: "Caching Project")
4. Sélectionnez les permissions: `repo`
5. Copiez le token
6. Quand Git demande le mot de passe, utilisez le token

### Erreur: "Updates were rejected"

Quelqu'un d'autre a poussé des modifications. Faites:

```bash
git pull origin main
# Résolvez les conflits si nécessaire
git push origin main
```

---

## ✅ Vérification

Après le push, allez sur https://github.com/wailman24/Caching et vérifiez que:
- ✅ Les nouveaux fichiers apparaissent
- ✅ Le commit est visible dans l'historique
- ✅ Le fichier `.env` n'est PAS visible (sécurité)

