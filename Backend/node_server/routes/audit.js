const express = require('express');
const fs      = require('fs');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router  = express.Router();

router.get('/', verifyToken, isAdmin, (_,res) => {
  const logs = fs.existsSync('audit.log')
    ? fs.readFileSync('audit.log','utf8').split('\n').filter(Boolean)
    : [];
  res.json(logs);
});

module.exports = router;
