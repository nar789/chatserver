;(function(){

	module.exports = function(){
		function global(){
			var express;
			var app;
			var bodyParser;
			var mysql;
		}

		function loadNodeModules() {
			_g=new global();//static global
			_g.express = require('express');
			_g.app = require('express')();
			_g.bodyParser = require('body-parser');
			_g.mysql = require('mysql2');
			_g.pool = _g.mysql.createPool({
				host : '127.0.0.1',
				user : 'root',
				password : 'black',
				database : 'chat',
				port : 3306
			});
			
		}

		function loadRoute() {
			var route = require('./Route.js')(_g);
			route.route();
		}

		function initialize(){
			var app=_g.app;
			app.set('view engine', 'ejs');
			app.engine('html', require('ejs').renderFile);
			app.use('/assets',_g.express.static(__dirname + '/../assets'));
			app.use(_g.bodyParser.urlencoded({
			    extended: true
			}));
			app.use(_g.bodyParser.json());
		}

		function doInBackend(){
			loadNodeModules();
			initialize();
			loadRoute();
		}

		return {
			doInBackend:doInBackend,
		};
	}

})();

