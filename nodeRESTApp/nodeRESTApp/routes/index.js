var express = require('express');
var router = express.Router();
var http = require('http');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* GET admin page. */
router.get('/userlist', function(req, res2) {
	// options for GET
	var optionsget = {
	    host : 'localhost', 
	    // (no http/https !)
	    port : 3000,
	    path : '/users/userlist', //REST API to get data
	    method : 'GET' 
	};

	console.info('Options prepared:');
	console.info(optionsget);
	console.info('Do the GET call');

	// do the GET request
	var reqGet = http.request(optionsget, function(res) {
	    console.log("statusCode: ", res.statusCode);

	    res.on('data', function(d) {
	        console.info('GET result:\n');
	        res2.render('adminpage', { userlist: JSON.parse(d) });//data received from REST api sent for rendering
	        console.info('\n\nCall completed', d);
	    });

	});

	reqGet.end();
	reqGet.on('error', function(e) {
	    console.error(e);
	});
  
});

module.exports = router;
