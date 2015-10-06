#!/usr/bin/node

// Currently works for organisations of up to 100 users
// If you need more, add pagination :)

var GitHubApi = require("github");
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

github.orgs.getMembers({ 
    org: "Xebia",
    per_page: 100 
}, function(error, members) {
    if (error) {
        console.log("Error fetching members: ", error);
    }
    members.forEach(function(member){
      github.events.getFromUser({
          user: member.login,
          per_page: 100
      }, function(error, events) {
          events.forEach(function(event){
              var repo = "n/a";
              if (event.repo) repo = event.repo.name;
              console.log(event.created_at, event.actor.login, event.type, repo);
          });
      });
    });
});
