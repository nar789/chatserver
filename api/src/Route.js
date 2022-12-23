const { response } = require("express");

;(function(){
	module.exports=function(_g){

		const app = _g.app;
		const pool = _g.pool;

		function route(){
			app.get('/',function(req,res){
				res.render('index.html',{});
			});

			app.get('/follow/:from/:to/:value',async function(req,res){
				const from = req.params.from;
				const to = req.params.to;
				const value = req.params.value;
				const conn = pool.promise();
				try {
					const [rows, fields] = await conn.query(`SELECT * FROM social WHERE my_id = '${from}' AND user_id = '${to}' AND type = 1`);
					if(rows.length >= 1) {
						await conn.query(`UPDATE social SET value = ${value} WHERE my_id = '${from}' AND user_id = '${to}' AND type = 1`);
					} else {
						await conn.query(`INSERT INTO social VALUES(null, 1, '${from}', '${to}', ${value})`);
					}
					res.send('success');

				} catch(err) {
					console.log(err);
					res.send('fail' + err);
				}
			});

			app.get('/follow/:from/:to',async function(req,res){
				const from = req.params.from;
				const to = req.params.to;
				const conn = pool.promise();
				try {
					const [rows, fields] = await conn.query(`SELECT * FROM social WHERE my_id = '${from}' AND user_id = '${to}' AND type = 1`);
					if(rows.length >= 1) {
						res.send(String(rows[0].value));
					} else {
						res.send('0');
					}
				} catch(err) {
					console.log(err);
					res.send('fail ' + err);
				}
			});

			app.get('/block/:from/:to/:value',async function(req,res){
				const from = req.params.from;
				const to = req.params.to;
				const value = req.params.value;
				const conn = pool.promise();
				try {
					const [rows, fields] = await conn.query(`SELECT * FROM social WHERE my_id = '${from}' AND user_id = '${to}' AND type = 2`);
					if(rows.length >= 1) {
						await conn.query(`UPDATE social SET value = ${value} WHERE my_id = '${from}' AND user_id = '${to}' AND type = 2`);
					} else {
						await conn.query(`INSERT INTO social VALUES(null, 2, '${from}', '${to}', ${value})`);
					}
					res.send('success');

				} catch(err) {
					console.log(err);
					res.send('fail' + err);
				}
			});

			app.get('/block/:from/:to',async function(req,res){
				const from = req.params.from;
				const to = req.params.to;
				const conn = pool.promise();
				try {
					const [rows, fields] = await conn.query(`SELECT * FROM social WHERE my_id = '${from}' AND user_id = '${to}' AND type = 2`);
					if(rows.length >= 1) {
						res.send(String(rows[0].value));
					} else {
						res.send('0');
					}
				} catch(err) {
					console.log(err);
					res.send('fail ' + err);
				}
			});

			app.get('/blockconversation/:from/:to/:value',async function(req,res){
				const from = req.params.from;
				const to = req.params.to;
				const value = req.params.value;
				const conn = pool.promise();
				try {
					const [rows, fields] = await conn.query(`SELECT * FROM social WHERE my_id = '${from}' AND user_id = '${to}' AND type = 3`);
					if(rows.length >= 1) {
						await conn.query(`UPDATE social SET value = ${value} WHERE my_id = '${from}' AND user_id = '${to}' AND type = 3`);
					} else {
						await conn.query(`INSERT INTO social VALUES(null, 3, '${from}', '${to}', ${value})`);
					}
					res.send('success');

				} catch(err) {
					console.log(err);
					res.send('fail' + err);
				}
			});

			app.get('/blockconversation/:from/:to',async function(req,res){
				const from = req.params.from;
				const to = req.params.to;
				const conn = pool.promise();
				try {
					const [rows, fields] = await conn.query(`SELECT * FROM social WHERE my_id = '${from}' AND user_id = '${to}' AND type = 3`);
					if(rows.length >= 1) {
						res.send(String(rows[0].value));
					} else {
						res.send('0');
					}
				} catch(err) {
					console.log(err);
					res.send('fail ' + err);
				}
			});


			app.get('/is',function(req,res){
				res.render('index.html',{});
			});

			app.listen(1224,function(){
			  preLoad();
			  console.log('FANTOO API server listen on *:1224');
			});
		}

		function preLoad(){
			//to-do
		}

		return {
			route:route,
		}
	}

})();



