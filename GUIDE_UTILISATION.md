# Guide d'Utilisation - Cache Simulator

Ce guide explique comment utiliser l'application **Cache Simulator** pour comprendre et démontrer les concepts de cache expliqués dans le README.

## 🎯 Objectif du Projet

Cette application simule un système de cache en mémoire qui démontre :
- **Cache-Aside** (stratégie de chargement)
- **Write-Through** (stratégie d'écriture)
- **LRU Eviction** (politique d'éviction)
- **Métriques de performance** (Hit Rate, Miss Rate, Evictions)
- **Gestion de la mémoire limitée** (1 MB max)

---

## 📊 Interface du Dashboard

### 1. **Métriques de Performance** (Cartes en haut)

Ces cartes affichent les métriques clés mentionnées dans le README :

#### **Hit Rate** (Taux de succès)
- **Formule** : `Cache Hit Rate = (Cache hits / Total Requests) × 100`
- **Signification** : Pourcentage de requêtes servies depuis le cache
- **Observation** :
  - **> 70%** = Excellent (vert, "Good")
  - **30-70%** = Modéré (jaune, "Moderate")
  - **< 30%** = Faible (rouge, "Low")

#### **Miss Rate** (Taux d'échec)
- **Formule** : `Cache Miss Rate = (Cache Miss / Total Requests) × 100`
- **Signification** : Pourcentage de requêtes nécessitant un accès à la base de données

#### **Total Evictions**
- **Signification** : Nombre d'éléments supprimés du cache à cause de la limite de mémoire
- **Politique utilisée** : **LRU (Least Recently Used)** - l'élément le moins récemment utilisé est supprimé en premier

#### **Total Requests**
- **Signification** : Nombre total d'opérations de recherche dans le cache

### 2. **Memory Gauge** (Jauge de mémoire)

- **Limite** : 1 MB (1024 KB) - simule la RAM limitée
- **Affichage** :
  - Pourcentage utilisé
  - Taille actuelle / Taille maximale
  - Nombre d'éléments en cache
  - Espace disponible

**💡 Concept démontré** : La mémoire est une ressource limitée (comme expliqué dans le README, section "Memory Limit")

### 3. **Event Log** (Journal des événements)

Affiche les 50 derniers événements du cache :
- **HIT** : Données trouvées dans le cache (vert)
- **MISS** : Données non trouvées, récupérées depuis la DB (orange)
- **EVICTION** : Élément supprimé à cause de la limite mémoire (rouge)
- **ADD** : Nouveau produit ajouté au cache
- **UPDATE** : Produit mis à jour
- **DELETE** : Produit supprimé du cache

---

## 🧪 Scénarios de Démonstration

### Scénario 1 : Démontrer **Cache-Aside** (Stratégie de chargement)

**Objectif** : Montrer comment le cache charge les données à la demande

**Prérequis** : Assurez-vous d'avoir des produits dans la base de données. Si vous n'en avez pas, créez-en avec "Add Product".

**Étapes** :
1. **Vider le cache** : Cliquez sur "Clear Cache"
   - ⚠️ **Note importante** : Après avoir cliqué sur "Clear Cache", les produits sont automatiquement rechargés depuis la base de données dans la liste "Fetch from Backend"
   - Le cache local est vidé, mais les produits restent disponibles pour être chargés
2. **Réinitialiser les métriques** : Cliquez sur "Reset Metrics" (optionnel, pour partir de zéro)
3. Dans la section "Cached Products", vous verrez une section **"Fetch from Backend"** avec des boutons pour chaque produit disponible dans la DB mais pas encore en cache
4. **Cliquez sur un bouton produit** dans "Fetch from Backend" (ex: "MacBook Pro 16")
5. **Observez en temps réel** :
   - Un événement **MISS** apparaît dans l'Event Log (orange)
   - Le produit apparaît dans le tableau "Cached Products"
   - Le "Miss Rate" augmente immédiatement
   - Le "Total Requests" augmente
   - Le "Memory Usage" augmente
   - Le produit disparaît de la section "Fetch from Backend"
6. **Cliquez à nouveau sur le même produit** dans le tableau (ou utilisez le bouton "Fetch" s'il réapparaît)
7. **Observez** :
   - Un événement **HIT** apparaît (vert)
   - Le "Hit Rate" augmente
   - Le "Miss Rate" diminue proportionnellement
   - Le compteur "Hits" du produit augmente dans le tableau

**📚 Concept démontré** : Cache-Aside - Les données sont chargées dans le cache uniquement lorsqu'elles sont explicitement demandées (pas pré-chargées automatiquement)

---

### Scénario 2 : Démontrer **Write-Through** (Stratégie d'écriture)

**Objectif** : Montrer que les écritures mettent à jour simultanément la DB et le cache

**Étapes** :
1. Cliquez sur **"+ Add Product"**
2. Remplissez le formulaire :
   - Nom : "iPhone 15 Pro"
   - Prix : 999.99
   - Catégorie : "Electronics"
   - Stock : 50
3. Cliquez sur **"Add Product"**
4. **Observez** :
   - Un événement **ADD** apparaît dans l'Event Log
   - Le produit apparaît immédiatement dans "Cached Products"
   - Le produit est aussi sauvegardé dans la base de données (backend)
   - Le "Memory Usage" augmente

**📚 Concept démontré** : Write-Through - Les écritures mettent à jour la base de données ET le cache simultanément (forte cohérence)

---

### Scénario 3 : Démontrer **LRU Eviction** (Politique d'éviction)

**Objectif** : Montrer comment les éléments sont supprimés quand la mémoire est pleine

**Étapes** :
1. **Vérifiez la limite** : La mémoire maximale est de 1 MB (1024 KB)
2. **Ajoutez plusieurs produits** jusqu'à ce que la mémoire approche de la limite
3. **Observez le Memory Gauge** : Quand il approche de 100%
4. **Ajoutez un nouveau produit** qui dépasse la limite
5. **Observez** :
   - Des événements **EVICTION** apparaissent dans l'Event Log (rouge)
   - Le compteur "Total Evictions" augmente
   - Les produits les moins récemment utilisés sont supprimés
   - Le nouveau produit est ajouté

**Test pour comprendre LRU** :
1. Ajoutez 3 produits : A, B, C
2. Cliquez sur A (pour l'utiliser - le rendre "récent")
3. Ajoutez un 4ème produit qui dépasse la limite
4. **Résultat attendu** : B ou C sera évincé (pas A, car il vient d'être utilisé)

**📚 Concept démontré** : LRU (Least Recently Used) - L'élément le moins récemment utilisé est supprimé en premier

---

### Scénario 4 : Analyser les **Métriques de Performance**

**Objectif** : Comprendre l'efficacité du cache et vérifier que les métriques se mettent à jour en temps réel

**Étapes** :
1. **Réinitialisez les métriques** : Cliquez sur "Reset Metrics"
   - ✅ **Vérification** : Toutes les métriques devraient revenir à 0
2. **Chargez plusieurs produits différents** depuis "Fetch from Backend" (MISS)
   - ✅ **Vérification** : Observez que les métriques se mettent à jour **immédiatement** :
     - "Total Requests" augmente
     - "Miss Rate" augmente
     - "Total Evictions" peut augmenter si la mémoire est pleine
3. **Rechargez les mêmes produits plusieurs fois** en cliquant sur leurs boutons "Fetch"
   - ✅ **Vérification** : Observez que les métriques se mettent à jour **en temps réel** :
     - "Hit Rate" augmente
     - "Miss Rate" diminue proportionnellement
     - "Total Requests" continue d'augmenter
4. **Observez les métriques en temps réel** :
   - Les cartes se mettent à jour automatiquement sans recharger la page
   - L'Event Log montre chaque opération
   - Le Memory Gauge se met à jour instantanément

**Interprétation** :
- **Hit Rate élevé (> 70%)** = Le cache fonctionne bien, beaucoup de données sont servies depuis le cache
- **Miss Rate élevé** = Beaucoup de requêtes nécessitent un accès DB (plus lent)
- **Évictions fréquentes** = Le cache est trop petit pour les données

**📚 Concept démontré** : Métriques de performance (section "Metrics of performance" du README) - Les métriques sont calculées et affichées en temps réel

---

### Scénario 5 : Comprendre la **Limite de Mémoire**

**Objectif** : Démontrer que la RAM est limitée

**Étapes** :
1. Observez le **Memory Gauge**
2. Ajoutez des produits et observez :
   - La barre de progression augmente
   - Le pourcentage augmente
   - L'espace disponible diminue
3. Quand vous approchez de 100% :
   - Les nouveaux ajouts déclenchent des évictions
   - Le système libère de l'espace automatiquement

**📚 Concept démontré** : La mémoire est une ressource limitée (section "Memory Limit" du README)

---

## 🔍 Fonctionnalités Avancées

### Recherche de Produits
- Utilisez la barre de recherche pour filtrer les produits en cache
- La recherche est instantanée (données en mémoire)

### Modification de Produits
1. Cliquez sur les **3 points** (⋮) à droite d'un produit
2. Sélectionnez **"Edit"**
3. Modifiez les informations
4. **Observez** : Un événement **UPDATE** apparaît

### Suppression de Produits
1. Cliquez sur les **3 points** (⋮)
2. Sélectionnez **"Delete from Cache"**
3. **Observez** : 
   - Un événement **DELETE** apparaît
   - Le produit disparaît du cache (mais reste en DB)
   - La mémoire libérée est visible dans le Memory Gauge

---

## 📈 Stratégies Implémentées (selon le README)

### ✅ Cache-Aside (Reads)
- **Implémentation** : Quand vous cliquez sur "Fetch" pour un produit non en cache
- **Comportement** :
  1. Vérifie le cache (frontend)
  2. Si MISS → Backend vérifie Redis
  3. Si MISS → Backend récupère depuis MySQL
  4. Backend stocke dans Redis
  5. Frontend stocke dans le cache local

### ✅ Write-Through (Writes)
- **Implémentation** : Quand vous ajoutez/modifiez un produit
- **Comportement** :
  1. Écrit dans MySQL (backend)
  2. Met à jour Redis immédiatement
  3. Met à jour le cache local (frontend)
  4. Utilise des verrous Redis pour éviter les conditions de course

### ✅ LRU Eviction
- **Implémentation** : Quand la mémoire dépasse 1 MB
- **Comportement** : Supprime l'élément avec le `lastAccessed` le plus ancien

---

## 🎓 Points Clés à Retenir

1. **Cache-Aside** = Chargement à la demande (lazy loading)
2. **Write-Through** = Écriture simultanée DB + Cache (forte cohérence)
3. **LRU** = Supprime le moins récemment utilisé
4. **Hit Rate élevé** = Cache efficace
5. **Évictions fréquentes** = Cache trop petit

---

## 📚 Référence au README

Cette application démontre concrètement les concepts expliqués dans le README :

- ✅ **Section "Loading Strategies"** → Cache-Aside
- ✅ **Section "Writing Strategies"** → Write-Through
- ✅ **Section "Eviction Policies"** → LRU
- ✅ **Section "Metrics of performance"** → Hit Rate, Miss Rate, Evictions
- ✅ **Section "Memory Limit"** → Limite de 1 MB
- ✅ **Section "Cache Locks"** → Implémenté dans le backend (Redis locks)

---

