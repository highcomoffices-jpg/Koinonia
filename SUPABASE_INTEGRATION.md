# Intégration Supabase - Documentation

## Vue d'ensemble

L'application Koinonia est maintenant entièrement intégrée avec Supabase pour la persistance des données. Toutes les données mockées ont été remplacées par des appels à la base de données Supabase avec mise en cache intelligente.

## Configuration

### Variables d'environnement (.env)
```
VITE_SUPABASE_URL=https://vsuzocbkolhnzcoxdhji.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdXpvY2Jrb2xobnpjb3hkaGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDU1NDksImV4cCI6MjA4MDAyMTU0OX0.8IAFWgMzGuW7ts70FI7xmWqYh1Xdw-b-CNN08Pkyl54
```

## Architecture

### 1. Client Supabase (`src/lib/supabase.ts`)
- Création du client avec configuration persistante de session
- Gestion des erreurs Supabase
- Utilitaires d'authentification

### 2. Service de base (`src/services/baseService.ts`)
- Classe générique `BaseService<T>` pour opérations CRUD
- Support des filtres avancés (eq, neq, gt, lt, in, like, ilike)
- Pagination et tri

### 3. Service de données (`src/services/dataService.ts`)
- `DataService` pour charger toutes les données principales
- Méthodes statiques pour chaque type de données
- Gestion centralisée des appels API

### 4. Hooks personnalisés (`src/hooks/useSupabaseData.ts`)
- `useSupabaseData()` - Hook principal pour charger tous les types de données
- `useSupabaseCountries()`, `useSupabaseConfessions()`, etc.
- Mise en cache intelligente (5 minutes par défaut)

## Persistance des données

### Fonctionnement
1. Lors du premier appel, les données sont chargées depuis Supabase
2. Un timestamp est enregistré pour chaque type de données
3. Les données sont stockées en cache global
4. Si les données sont utilisées à nouveau dans un délai de 5 minutes, le cache est utilisé
5. Après 5 minutes, les données sont rechargées depuis Supabase

### Survie au redémarrage du serveur
- Les données sont stockées dans la base de données Supabase (persistance permanente)
- Le cache local dans l'application est temporaire et utilisé pour optimiser les performances
- Lors d'un redémarrage du serveur, l'application recharge les données depuis Supabase

## Utilisation

### Dans un composant React
```typescript
import { useSupabaseFormations } from '../hooks/useSupabaseData';

function FormationsPage() {
  const { formations, isLoading, error, refetch } = useSupabaseFormations();

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {formations.map(formation => (
        <div key={formation.id}>{formation.title}</div>
      ))}
    </div>
  );
}
```

### Utiliser DataService directement
```typescript
import { dataService } from '../services/dataService';

const formations = await dataService.getFormations();
const marketItems = await dataService.getMarketItems(100); // limite personnalisée
```

## Données disponibles

### Données géographiques
- `getCountries()` - Tous les pays
- `getCities()` - Toutes les villes
- `getConfessions()` - Confessions religieuses validées
- `getParishes()` - Paroisses validées

### Données sociales
- `getPosts(limit)` - Publications récentes
- `getMarketItems(limit)` - Articles du marché actifs
- `getServices(limit)` - Services disponibles
- `getFormations(limit)` - Formations disponibles
- `getGroups(limit)` - Groupes actifs
- `getActivities(limit)` - Activités à venir

### Données premium
- `getChallenges(limit)` - Défis communautaires actifs
- `getPrayerWallEntries(limit)` - Entrées du mur des prières publiques
- `getBiblicalPaths(limit)` - Parcours bibliques publics
- `getLocationMeditations(limit)` - Méditations géolocalisées
- `getLiveCelebrations(limit)` - Célébrations en direct actives

## Performance

### Caching
- Durée du cache: 5 minutes
- Les données en cache ne sont rechargées que si le cache a expiré
- Refetch manuel possible via `refetch()` ou `refetch(key)`

### Limitations et pagination
```typescript
getMarketItems(50);    // 50 articles maximum
getFormations(10);     // 10 formations maximum
getPosts(20);          // 20 posts maximum
```

## Authentication et RLS

### Row Level Security (RLS)
- Toutes les tables ont RLS activé
- Données publiques accessibles à tous les utilisateurs authentifiés
- Données privées protégées par les politiques RLS

### Session persistante
- La session est automatiquement sauvegardée dans `localStorage`
- Clé: `koinonia-supabase-auth`
- La session persiste à travers les redémarrages du navigateur

## Gestion des erreurs

Tous les services gèrent les erreurs Supabase:
```typescript
try {
  const data = await dataService.getFormations();
} catch (error) {
  console.error('Erreur:', error.message);
  // Afficher message d'erreur à l'utilisateur
}
```

## Schéma de base de données

Voir `create_database_schema.sql` pour la structure complète:
- 34 tables
- Relations avec clés étrangères
- Indexes pour performance
- RLS configuré

## Prochaines étapes

1. **Importer les données mockées** dans la base de données:
   - Exécuter `create_database_schema.sql` pour créer le schéma
   - Utiliser les données du fichier de schéma SQL

2. **Mettre à jour les pages** pour utiliser les hooks Supabase au lieu des données mockées

3. **Ajouter des mutations** (créer, modifier, supprimer) via DataService

4. **Implémenter la pagination** complète dans les composants

5. **Ajouter des filtres** avancés pour les recherches

## Support

Pour toute question sur l'intégration Supabase, consultez:
- Documentation Supabase: https://supabase.com/docs
- Client JavaScript: https://supabase.com/docs/reference/javascript
- RLS: https://supabase.com/docs/guides/auth/row-level-security
