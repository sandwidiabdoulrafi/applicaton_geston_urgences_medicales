const express = require("express");
const router = express.Router();
const { checkFirebaseConnection } = require("../controllers/firebaseController");

router.get("/test", checkFirebaseConnection);

module.exports = router;
