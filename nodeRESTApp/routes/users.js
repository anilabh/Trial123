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
/* POST newuser */
router.post('/newuser',function(req,res){
	var userEmail = req.body.userEmail;
	var password = req.body.password;
	var userName = req.body.userName;
	
	console.log('Received add request for :',userEmail);
	 //check if already exists....
    con.query('select count(*) as num from users where email=(?) || nick=(?);',[userEmail,userName], function (err, docs){
        console.log('already existing users:',docs[0].num);
        if(docs[0].num > 0){
        	res.json({err:1});
        }
    });
    // new user, add to the DB, encript password
    con.query('insert into users (nick,email,pass) values (?,?,md5(?));',[userName,userEmail,password], function (err, doc) {
        if (err) {
            // If it failed, return error
        	res.json({err:2});
        }
        else {  
        	console.log('successfully added new user');
            res.json({err:0});//successfully added new user
            };
        });
});
/*POST transfunds */
router.post('/transfunds',function(req,res){
	var curUser = req.body.curUser;
	var amount = req.body.amount;
	var transferee = req.body.transferee;
	var password = req.body.password;
	 //check for available balance > amount
    con.query('select balance,iduser from users where email=(?) && pass=md5(?);', [curUser,password], function (err, rows, fields) {
    	if (err) {
    	    console.log('SQL error in transfer-1',err);
    	}
    	else {
    		var rescount = rows.length
    		if (rescount > 0) {
    				if(rows[0].balance >= amount){
    					//deduct amount from balance - update balance
    					new_balance = rows[0].balance - amount;
    					con.query('update users set balance=(?) where email=(?);',[new_balance,curUser], function (err2, rows2, fields2) {
    			        	if (err2) {
    			        	    console.log('SQL error in transfer-2',err2);
    			        	}
    			        	else {
    			        		console.log('Deducted:',amount,' From:',curUser, 'New Balance:',new_balance);
    			        		//add amount to transferee
    			        		con.query('update users set balance=balance+(?) where iduser=(?);',[amount,transferee], function (err3, rows3, fields3) {
            			        	if (err3) {
            			        	    console.log('SQL error in transfer-3', err3);
            			        	}
            			        	else {//update transactions table
            			        		console.log('Transfree id:',transferee)
            			        		con.query('insert into transactions (from_user, to_user,amount, ts) values ((?),(?),(?), CURRENT_TIMESTAMP);',[rows[0].iduser,transferee,amount], function (err4, rows4, fields4) {
                    			        	if (err4) {
                    			        	    console.log('SQL error in transfer-4',err4);
                    			        	   }
                    			        	else {
                    			        		console.log('successfully transferred:',amount,' To:',transferee);
                    			        		//refresh user accounts page
                    			                res.json({err:0});
                    			        	}
            			        		});
            			        	}
    			        		});
    			        	}
    					});
    				}
    				else{
    					console.log('Balance:',rows[0].balance,'Amount:',amount,' Cannot transfer');
    					res.json({err:1});
    				}
    				}
    			}//else line159
    		});
});
/* POST auth */
router.post('/auth',function(req,res){
	var userEmail = req.body.userEmail;
	var password = req.body.password;
	var session = req.body.session;
	
	console.log('Received login request for :',userEmail);
	var queryStr = '';
	var key = []
	if(session){
		//valid session
		queryStr = 'select iduser,nick,email,balance,is_admin from users where email=(?);';
		key = [session];
	}
	else{
		//no session, authenticate user
		queryStr = 'select iduser,nick,email,balance,is_admin from users where email=(?) && pass=md5(?);';
		key = [userEmail, password];
	}
	console.log('Query:',queryStr, key);
	con.query(queryStr, key, function (err, rows, fields) {
	if (err) {
	    console.log('SQL error in renderUserPage');
	}
	else {
		var rescount = rows.length
		if (rescount > 0) {
			//set session cookie
			console.log('valid user:',rows[0].email);
		//	req.mySession.username = rows[0].email;
			if(rows[0].is_admin != 1){
				
				console.log('This is a regular user. Get account activities');
				con.query('SELECT b1.nick as from_u, b2.nick as to_u, a.amount FROM test.transactions a, test.users b1, test.users b2 where (a.from_user=(?) || a.to_user=(?)) && b1.iduser = a.from_user && b2.iduser = a.to_user;', [rows[0].iduser,rows[0].iduser], function (err2, rows2, fields2){
					console.log('number of activities= ', rows2.length)
					
					con.query('select nick, iduser from users where iduser <> (?) && is_admin <> 1', [rows[0].iduser], function (err3, rows3, fields3){
					console.log('number of transferee= ', rows3.length)
					res.json({ userlist: rows, transactions: rows2, transferees: rows3 });
					});
				});
				
			}
			else {
				console.log('This is an admin user.Get all userlist');
				con.query('select nick,email,balance from users where is_admin <> 1', function (err, docs)
					    {
					        res.json({ userlist: docs, is_admin:1 });
					    });
			}
				
		}
		else{
			console.log('No user found with that email. Back to home page')
			res.json(null);
	    	}
	        
	    };
});

});


module.exports = router;
