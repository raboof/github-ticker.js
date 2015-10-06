#!/usr/bin/node

// Currently works for organisations of up to 100 users
// If you need more, add pagination :)
const max_users = 100;
const max_events = 20;

var GitHubApi = require("github");
var async = require("async");
var _ = require("underscore");
const GitHubOauthToken = process.env.GITHUB_OAUTH_TOKEN;

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

github.orgs.getMembers({ 
    org: "Xebia",
    per_page: max_users
}, function(error, members) {
    if (error) {
        console.log("Error fetching members: ", error);
        return;
    }

    async.map(members,
        function(member, callback){
            github.events.getFromUser({
                user: member.login,
                per_page: max_events
            }, callback);
        },
        function(err, eventss) {
            _.flatten(eventss)
             .sort(byCreationTime)
             .slice(0, max_events)
             .forEach(function(event){
                var repo = "n/a";
                if (event.repo) repo = event.repo.name;
                console.log(event.created_at, event.actor.login, event.type, repo);
            });
        });
});
