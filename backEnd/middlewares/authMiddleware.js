const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Token manquant ou invalide"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.idPatient = decoded.idPatient;

        next();

    } catch (error) {
        console.error("❌ Erreur middleware JWT :", error);
        return res.status(401).json({
            success: false,
            message: "Token invalide ou expiré"
        });
    }
};

module.exports = authMiddleware;
