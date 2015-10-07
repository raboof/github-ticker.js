#!/usr/bin/node

// Currently works for organisations of up to 100 users
// If you need more, add pagination :)
const max_users = 100;
const max_events = 20;

var GitHubApi = require('github');
var async = require('async');
var express = require('express');
var mustacheExpress = require('mustache-express');
var _ = require('underscore');

const GitHubOauthToken = process.env.GITHUB_OAUTH_TOKEN;
const organization = process.env.GITHUB_ORG || 'Xebia';

var github = new GitHubApi({
    version: "3.0.0",
    debug: false,
    protocol: "https",
    host: "api.github.com",
    pathPrefix: "",
    timeout: 5000,
    headers: {
        "user-agent": "GitHub-Ticker"
    }
});
github.authenticate({
    type: "oauth",
    token: GitHubOauthToken
});

function byCreationTime(a, b) {
    return a.created_at < b.created_at ? 1 : -1;
}

function member_events(member, callback) {
    github.events.getFromUser({
        user: member.login,
        per_page: max_events
    }, callback);
}

function organization_member_events(organization, callback) {
    github.orgs.getMembers({
        org: organization,
        per_page: max_users
    }, function(error, members) {
        if (error) {
            callback(error);
            return;
        }

        async.map(members, member_events, function(err, eventss) {
            callback(null, _.flatten(eventss)
             .sort(byCreationTime)
             .slice(0, max_events))
        });
    });
};

const app = express();
app.get('/orgs/' + organization + '/member_events', function(req, res) {
    organization_member_events(organization, function(error, events) {
        if (error) res.send('Error: ' + error);
        else res.send(events);
    });
})

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views')
app.get('/', function(req, res) {
    res.render('index', {
        'organization': organization
    });
});
app.use(express.static(__dirname + '/static'));

const server = app.listen(process.env.PORT, function() {
  console.log('Listening on %s:%s', server.address().address, server.address().port);
});
