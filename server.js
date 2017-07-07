'use strict'

const Hapi = require('hapi');
const Request = require('request');
const Vision = require('vision');
const Handlebars = require('handlebars');
const LodashFilter = require('lodash.filter');
const LodashTake = require('lodash.take');
const server = new Hapi.Server();

server.connection({
	host:'127.0.0.1',
	port:3000
});

server.register(Vision, (err) => {
	server.views({
		engines:{
			html: Handlebars
		},
		relativeTo: __dirname,
		path: './view',
	});
});

server.route({
	method: 'GET',
	path: '/',
	handler: function(request,reply){
		Request.get('http://api.football-data.org/v1/competitions/445/leagueTable', function(error,response,body){
			if (error) {
				throw error;
			}
			const data = JSON.parse(body);
			reply.view('index',{result:data});
		});
	}
});

server.route({
    method: 'GET',
    path: '/teams/{id}',
    handler: function (request, reply) {
        const teamID = encodeURIComponent(request.params.id);
 
        Request.get(`http://api.football-data.org/v1/teams/${teamID}`, function (error, response, body) {
            if (error) {
                throw error;
            }
 
            const detailTeam = JSON.parse(body);
 
            Request.get(`http://api.football-data.org/v1/teams/${teamID}/fixtures`, function (error, response, body) {
                if (error) {
                    throw error;
                }
 
                const fixtures = LodashTake(LodashFilter(JSON.parse(body).fixtures, function (match) {
                    return match.status === 'SCHEDULED';
                }), 37);
 
                reply.view('team', { result: detailTeam, fixtures: fixtures });
            });
        });
    }
});

Handlebars.registerHelper('teamID',function(teamURL){
	return teamURL.slice(38);
})

server.start((err)=>{
	if (err) {
		throw err;
	}
	console.log(`Server is running at: ${server.info.uri}`);
});

