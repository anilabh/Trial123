var express = require('express');
var router = express.Router();
var http = require('http');

function renderUserPage(userEmail,password, req, res2, session){
	// do a POST request
	// create the JSON object
	jsonObject = JSON.stringify({
	    "userEmail" : userEmail,
	    "password" : password,
	    "session": session
	});
	 
	// prepare the header
	var postheaders = {
	    'Content-Type' : 'application/json',
	    'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
	};
	 
	// the post options
	var optionspost = {
	    host : 'localhost',
	    port : 3000,
	    path : '/users/auth',
	    method : 'POST',
	    headers : postheaders
	};
	 	 
	// do the POST call
	var reqPost = http.request(optionspost, function(res) {
	    console.log("statusCode: ", res.statusCode);
	 
	    res.on('data', function(d) {
	        console.info('POST result:\n');
	        if(res.statusCode == 200){
	        	var userdata = JSON.parse(d);
	        	console.log('data received from REST call:',userdata);
	        	if(userdata != null && userdata.userlist.length > 0){
		        	if(!req.mySession.username){
		        		req.mySession.username = userEmail;//set session
		        		console.log('Session created:',req.mySession.username);
		        	} 
		        	if(userdata.is_admin == 1){
		        		console.log('This is an admin user');
		        		res2.render('adminpage',{userlist:userdata.userlist});
		        	}
		        	else{
		        		console.log('This is a regular user. Show user profile page.');
			        	res2.render('userprofile', { userlist: userdata.userlist, transactions: userdata.transactions, transferees: userdata.transferees });
		        	}
	        	}
	        	else{
	        		console.log('No user found with that email. Back to home page')
	    			res2.render('home', { title: 'Wrong Credentials. Try again' });
	        	}
	        }
	        
	        console.info('\n\nPOST completed');
	    });
	});
	 
	// write the json data
	reqPost.write(jsonObject);
	reqPost.end();
	reqPost.on('error', function(e) {
	    console.error(e);
	});
}
/*  Login. */
router.post('/login', function(req, res) {
	// Get our form values
	console.log('POST request for login');
    var userEmail = req.body.email;
    var password = req.body.password;
	if(userEmail == '' || password == ''){
    	res.render('home', { title: 'No fields should be empty' });
    	return;
    };
    renderUserPage(userEmail,password, req, res, null);
 });

/* POST Add User */
router.post('/adduser', function (req, res2) {

    // Get our form values.
    var userName = req.body.nick;
    var userEmail = req.body.email;
    var password = req.body.password;
    if(userName == '' || userEmail == '' || password == ''){
    	res2.render('home', { title: 'No fields should be empty' });
    	return;
    };
    
    //email validation
    var atpos = userEmail.indexOf("@");
    var dotpos = userEmail.lastIndexOf(".");
    if (atpos< 1 || dotpos<atpos+2 || dotpos+2>=userEmail.length) {
        res2.render('home', { title: 'Email not valid' });
        return;
    };    
    
	jsonObject = JSON.stringify({
	    "userEmail" : userEmail,
	    "password" : password,
	    "userName": userName
	});
	 
	// prepare the header
	var postheaders = {
	    'Content-Type' : 'application/json',
	    'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
	};
	 
	// the post options
	var optionspost = {
	    host : 'localhost',
	    port : 3000,
	    path : '/users/newuser',
	    method : 'POST',
	    headers : postheaders
	};
	 	 
	// do the POST call
	var reqPost = http.request(optionspost, function(res) {
	    console.log("statusCode: ", res.statusCode);
	 
	    res.on('data', function(d) {
	        console.info('POST result:\n');
	        if(res.statusCode == 200){
	        	var userdata = JSON.parse(d);
	        	console.log('data received from REST call:',userdata);
	        	if(userdata != null){
	        		if(userdata.err == 0){
		        	if(!req.mySession.username){
		        		req.mySession.username = userEmail;//set session
		        		console.log('Session created:',req.mySession.username);
		        		renderUserPage(null,null, req, res2, req.mySession.username);
		        	} 
	        		}
		        	if(userdata.err == 1){
		        		console.log('User alreasy exists. Try Again');
		        		res2.render('home', { title: 'Username/Email already exists. Try again' });
		        	}
	        	}
	        	else{
	        		console.log('Error while adding user. Try again')
	    			res2.render('home', { title: 'Error while adding user. Try again' });
	        	}
	        }
	        
	        console.info('\n\nPOST completed');
	    });
	});
	 
	// write the json data
	reqPost.write(jsonObject);
	reqPost.end();
	reqPost.on('error', function(e) {
	    console.error(e);
	});
   
});
/* POST transfer */
router.post('/transfer', function (req, res2) {
	console.log('Post request for transfer');
    if(req.mySession.username){
    	console.log('Valid session:',req.mySession.username);
        var amount = req.body.amount;
        var transferee = req.body.transferee;
        var password = req.body.password;
        
        if(isNaN(amount) || amount <=0 ){
        	console.log('Invalid amount:',amount,' Return to home')
        	renderUserPage(null,null, req, res2, req.mySession.username);
        	return;
        }
        console.log('Amount:',amount,'To be transfered to:',transferee);
        jsonObject = JSON.stringify({
    	    "curUser" : req.mySession.username,
    	    "amount" : amount,
    	    "transferee": transferee,
    	    "password":password
    	});
    	 
    	// prepare the header
    	var postheaders = {
    	    'Content-Type' : 'application/json',
    	    'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
    	};
    	 
    	// the post options
    	var optionspost = {
    	    host : 'localhost',
    	    port : 3000,
    	    path : '/users/transfunds',
    	    method : 'POST',
    	    headers : postheaders
    	};
    	 	 
    	// do the POST call
    	var reqPost = http.request(optionspost, function(res) {
    	    console.log("statusCode: ", res.statusCode);
    	 
    	    res.on('data', function(d) {
    	        console.info('POST result:\n');
    	        if(res.statusCode == 200){
    	        	var userdata = JSON.parse(d);
    	        	console.log('data received from REST call:',userdata);
    	        	if(userdata != null){
    	        		renderUserPage(null,null, req, res2, req.mySession.username);
    	        }
    	        }
    	        console.info('\n\nPOST completed');
    	    });
    	});
    	 
    	// write the json data
    	reqPost.write(jsonObject);
    	reqPost.end();
    	reqPost.on('error', function(e) {
    	    console.error(e);
    	});
        
        }
    else{
    	console.log('User session expired. login again: ',req.body.email);
    	res.render('home', { title: 'New User' }); 
    }
});
/*  GET Generic. */
router.get('/*', function(req, res) {
	console.log('GET request for login');
    if(req.mySession.username){
    	console.log('Valid session:',req.mySession.username);
    	renderUserPage(null,null, req, res, req.mySession.username);
    }
    else{
    	console.log('User session expired. login again: ',req.body.email);
    	res.render('home', { title: 'New User' });
    }
 });

/*  Logout. */
router.post('/logout', function (req, res) {
	  console.log('POST Logout request. Resetting session for:', req.mySession.username)
	  req.mySession.reset();
	  res.render('home', { title: 'New User' });
	});

module.exports = router;
