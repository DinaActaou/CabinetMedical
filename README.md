# MediBook / Cabinet médical

Application web de gestion des rendez-vous (Laravel). Le projet applicatif se trouve dans le dossier **`backend/`**.

## Prérequis

- PHP ^8.3 (voir `backend/composer.json`)
- Composer
- MySQL (ou MariaDB compatible)

## Installation après clonage

```bash
git clone https://github.com/DinaActaou/CabinetMedical.git
cd CabinetMedical/backend

composer install
cp .env.example .env
php artisan key:generate
```

Configurez la base dans **`.env`** (exemple) :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=votre_base
DB_USERNAME=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
```

Démarrez MySQL, puis :

```bash
php artisan migrate --seed
php artisan serve
```

Ouvrez **http://127.0.0.1:8000** (ou l’URL affichée par `serve`).

## Comptes de démonstration (après `migrate --seed`)

Mot de passe pour tous les comptes ci-dessous : **`password`** (tout en minuscules).

- **Admin** — `admin@medibook.com`
- **Patient** — `patient@medibook.com` (autres patients seedés : `fatima@example.com`, etc., même mot de passe)
- **Médecin** — `doctor@medibook.com` (autres médecins seedés : `sara@example.com`, etc., même mot de passe)

## API REST — préfixe `/api`

Exemple de base : `http://127.0.0.1:8000/api/...`

Les routes protégées attendent un jeton **Sanctum** : en-tête `Authorization: Bearer {token}` (obtenu via `POST /api/login` ou `POST /api/register` en JSON avec `Accept: application/json`).

### Sans authentification

- `POST /api/login` — connexion
- `POST /api/register` — inscription (patient)
- `GET /api/external/appointments` — liste des rendez-vous (intégration externe)
- `POST /api/external/appointments` — création d’un rendez-vous (intégration externe)

### Authentifié — rôles patient, médecin ou admin

- `GET /api/user` — utilisateur connecté
- `POST /api/logout` — déconnexion
- `GET /api/notifications` — notifications + compteur non lus
- `POST /api/notifications/read-all` — tout marquer comme lu
- `POST /api/notifications/{id}/read` — marquer une notification comme lue
- `GET /api/services` — liste des services
- `GET /api/appointments/availability` — créneaux déjà pris (`doctor_id`, `appointment_date`) — **patient uniquement**
- `GET /api/users/doctors` — médecins approuvés
- `GET /api/appointments` — liste des RDV (filtrée par rôle ; paramètre optionnel `search`)
- `POST /api/appointments` — créer un RDV
- `GET /api/appointments/{appointment}` — détail d’un RDV
- `PUT /api/appointments/{appointment}` ou `PATCH /api/appointments/{appointment}` — mettre à jour un RDV
- `DELETE /api/appointments/{appointment}` — supprimer un RDV

### Authentifié — médecin ou admin

- `GET /api/dashboard/stats` — statistiques du tableau de bord
- `GET /api/users/patients` — liste des patients

### Authentifié — admin

- `GET /api/users` — liste des utilisateurs
- `PUT /api/users/{user}/role` — modifier le rôle d’un utilisateur

### JSON pour le SPA (session cookie, hors `/api`)

Même logique côté contrôleurs, routes sous **`/web-api/...`** (session web + CSRF), définies dans `routes/web.php` — utiles pour l’interface chargée depuis `/`, sans jeton Bearer.
