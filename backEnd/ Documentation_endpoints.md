# 📚 Documentation API - Gestion Urgences Médicales

Base URL: `http://localhost:3000`

---

##  PATIENTS

###  Ajouter un patient
```http
POST /patient/add
Content-Type: application/json

{
  "idPatient": "P_12345",
  "nom": "Sanogo",
  "prenom": "Rafi",
  "email": "rafi@example.com",
  "telephone": "+22670123456",
  "adresse": "Ouagadougou"
}
```

###  Récupérer tous les patients
```http
GET /patient/get_all
```

###  Mettre à jour un patient
```http
PUT /patient/update
Content-Type: application/json

{
  "idPatient": "P_12345",
  "telephone": "+22670999999"
}
```

###  Supprimer un patient
```http
DELETE /patient/delete
Content-Type: application/json

{
  "idPatient": "P_12345"
}
```

---

##  URGENCES

###  Créer une urgence
```http
POST /urgence/add
Content-Type: application/json

{
  "idUrgence": "U_0001",
  "idPatient": "P_12345",
  "intitule": "Accident de la route",
  "description": "Collision véhicule",
  "statut": "en attente",
  "priorite": "haute",
  "latitude": 12.3714,
  "longitude": -1.5197
}
```

###  Récupérer toutes les urgences
```http
GET /urgence/getAll
```

###  Mettre à jour une urgence
```http
PUT /urgence/update
Content-Type: application/json

{
  "id": "urgence_doc_id",
  "statut": "en cours",
  "idAssistant": "S_001"
}
```

###  Supprimer une urgence
```http
DELETE /urgence/delete
Content-Type: application/json

{
  "id": "urgence_doc_id"
}
```

---

##  SERVICES DE SANTÉ

###  Ajouter un service
```http
POST /service/add
Content-Type: application/json

{
  "idService": "S_001",
  "nomEtablissement": "Clinique Les Étoiles",
  "email": "contact@etoiles.com",
  "telephone": "+22660123456",
  "typeEtablissement": "Hôpital",
  "adresse": "Patte d'Oie",
  "ville": "Ouagadougou",
  "latitude": 12.358,
  "longitude": -1.512,
  "heureOuverture": "08:00",
  "heureFermeture": "18:00",
  "ouvert24h": false,
  "description": "Service d'urgence",
  "isActive": true
}
```

###  Récupérer tous les services
```http
GET /service/get_all_service_sante
```

###  Récupérer un service par ID
```http
GET /service/:idService
```

###  Mettre à jour un service
```http
PUT /service/update
Content-Type: application/json

{
  "idService": "S_001",
  "telephone": "+22660999999",
  "ouvert24h": true
}
```

###  Supprimer un service
```http
DELETE /service/delete
Content-Type: application/json

{
  "idService": "S_001"
}
```

---

##  MESSAGES

###  Ajouter un message
```http
POST /messages/ajouter
Content-Type: application/json

{
  "idUrgence": "U_0001",
  "text": "Ambulance en route",
  "type": "text",
  "sender": "assistant",
  "uri": null,
  "fileName": null,
  "duration": null
}
```

**Types valides:** `text`, `image`, `video`, `document`, `audio`  
**Senders valides:** `patient`, `assistant`

###  Récupérer les messages d'une urgence
```http
GET /messages/urgence/:idUrgence
```

###  Récupérer un message précis
```http
GET /messages/:idMessage
```

###  Mettre à jour le statut d'un message
```http
PUT /messages/:idMessage
Content-Type: application/json

{
  "status": "lu"
}
```

**Status valides:** `envoi`, `envoye`, `erreur`, `lu`

###  Supprimer un message
```http
DELETE /messages/:idMessage
```

---

##  NOTIFICATIONS

###  Récupérer toutes les notifications
```http
GET /notif/get
```

###  Mettre à jour une notification
```http
PUT /notif/update
Content-Type: application/json

{
  "id": "notif_doc_id",
  "isRead": true
}
```

###  Supprimer une notification
```http
DELETE /notif/delete
Content-Type: application/json

{
  "id": "notif_doc_id"
}
```

---

## ROUTES & CALCULS

###  Calculer la distance entre deux points
```http
GET /routes/calculate-distance?lat1=12.3714&lon1=-1.5197&lat2=12.358&lon2=-1.512
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "distance": "1.85",
    "unit": "km",
    "estimatedTime": 3,
    "timeUnit": "minutes"
  }
}
```

---

##  TEST FIREBASE

### Tester la connexion Firebase
```http
GET /firebase/test
```

Cette route insère des données de test dans toutes les collections.

---

##  Réponses Standards

### Succès
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques"
}
```

---

## Exemples avec cURL

### Créer une urgence
```bash
curl -X POST http://localhost:3000/urgence/add \
  -H "Content-Type: application/json" \
  -d '{
    "idUrgence": "U_TEST",
    "idPatient": "P_12345",
    "intitule": "Test urgence",
    "description": "Test",
    "priorite": "haute",
    "latitude": 12.3714,
    "longitude": -1.5197
  }'
```

### Récupérer tous les services
```bash
curl http://localhost:3000/service/get_all_service_sante
```

### Ajouter un message
```bash
curl -X POST http://localhost:3000/messages/ajouter \
  -H "Content-Type: application/json" \
  -d '{
    "idUrgence": "U_0001",
    "text": "Test message",
    "type": "text",
    "sender": "patient"
  }'
```

---

##  Démarrage rapide

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer Firebase** (`.env`)
```env
FIREBASE_PROJECT_ID=ton-projet-id
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
```

3. **Démarrer le serveur**
```bash
npm run dev
```

4. **Tester**
```bash
curl http://localhost:3000/health
```