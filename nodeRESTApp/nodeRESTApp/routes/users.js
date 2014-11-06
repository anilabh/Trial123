var express = require('express');
var router = express.Router();

//mysql
var mysql = require('mysql');
var con =  mysql.createConnection({
    host : 'localhost',
    user : '',
    password: '' ,
    database: 'test'
});

con.connect();

/* GET users listing. */
router.get('/userlist', function(req, res) {
	con.query('select nick,email,balance from users where is_admin <> 1', function (err, docs){
		res.json(docs);
	});
});

module.exports = router;
