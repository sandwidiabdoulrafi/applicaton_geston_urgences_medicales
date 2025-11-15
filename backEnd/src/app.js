// const express = require("express");
// const cors = require("cors");

// // Import des routes
// const urgenceRoutes = require("./routes/urgenceRoutes");
// const patientRoutes = require("./routes/patientRoutes");
// const servicesRoutes = require("./routes/serviceRoutes");

// const app = express();

// // ✅ Middleware globaux
// app.use(cors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ Route de santé (health check)
// app.get('/health', (req, res) => {
//     res.status(200).json({ 
//         status: 'OK', 
//         message: 'Serveur de gestion des urgences opérationnel',
//         timestamp: new Date().toISOString()
//     });
// });

// // ✅ Routes API REST avec préfixe cohérent
// app.use("/patients", patientRoutes);
// app.use("/services", servicesRoutes);
// app.use("/urgences", urgenceRoutes);

// // ✅ Gestion des routes non trouvées
// app.use((req, res) => {
//     res.status(404).json({ 
//         error: 'Route non trouvée',
//         path: req.path 
//     });
// });

// // ✅ Gestion des erreurs globales
// app.use((err, req, res, next) => {
//     console.error('❌ Erreur serveur:', err);
//     res.status(err.status || 500).json({ 
//         error: err.message || 'Erreur interne du serveur',
//         ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//     });
// });

// module.exports = app;











const express = require("express");
const cors = require("cors");

// ✅ Vérification qu'Express est bien chargé
if (!express) {
    console.error('❌ ERREUR: Express n\'est pas installé ou ne peut pas être chargé');
    process.exit(1);
}

// ✅ Création de l'application Express
const app = express();

// ✅ Vérification que app est bien créé
if (!app || typeof app.use !== 'function') {
    console.error('❌ ERREUR: L\'application Express n\'a pas été créée correctement');
    process.exit(1);
}

// ✅ Middleware globaux
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Route de santé (health check)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Serveur de gestion des urgences opérationnel',
        timestamp: new Date().toISOString()
    });
});

// ✅ Import des routes APRÈS la création de app
const urgenceRoutes = require("./routes/urgenceRoutes");
const patientRoutes = require("./routes/patientRoutes");
const servicesRoutes = require("./routes/serviceRoutes");

// ✅ Routes API REST avec préfixe cohérent
app.use("/patients", patientRoutes);
app.use("/services", servicesRoutes);
app.use("/urgences", urgenceRoutes);

// ✅ Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route non trouvée',
        path: req.path 
    });
});

// ✅ Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ✅ Export de l'application
module.exports = app;