# MediBook / Cabinet médical

Application web de gestion des rendez-vous.Le projet applicatif se trouve dans le dossier **`backend/`**

## Prérequis
- PHP ^8.3 
- Composer
- MySQL
## Installation après clonage
```bash
git clone https://github.com/DinaActaou/CabinetMedical.git
cd CabinetMedical/backend

composer install
cp .env.example .env
php artisan key:generate
```

Configurez la base dans **`.env`** :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=votre_base
DB_USERNAME=votre_nom_utilisateur
DB_PASSWORD=votre_mot_de_passe
```

Démarrez MySQL, puis :
php artisan migrate --seed
php artisan serve
Ouvrez l’URL affichée par `serve`

## Comptes de connexion 

Mot de passe pour tous les comptes ci-dessous : **`password`** 

- **Admin** — `admin@medibook.com`
- **Patient** — `patient@medibook.com` 
- **Médecin** — `doctor@medibook.com` 
- **Endpoints**
- `POST /api/login` — connexion
- `POST /api/register` — inscription (patient)
- `GET /api/external/appointments` — liste des rendez-vous 
- `POST /api/external/appointments` — création d’un rendez-vous 
- `GET /api/user` — utilisateur connecté
- `POST /api/logout` — déconnexion
- `GET /api/services` — liste des services
- `GET /api/appointments/availability` — créneaux déjà pris (`doctor_id`, `appointment_date`) 
- `GET /api/users/doctors` — médecins approuvés
- `GET /api/appointments` — liste des RDV 
- `POST /api/appointments` — créer un RDV
- `PUT /api/appointments/{appointment}` — mettre à jour un RDV
- `DELETE /api/appointments/{appointment}` — supprimer un RDV
- `GET /api/users/patients` — liste des patients
- `GET /api/users` — liste des utilisateurs
- `PUT /api/users/{user}/role` — modifier le rôle d’un utilisateur

