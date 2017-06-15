'use strict';
var express = require('express');
var router = express.Router();
const client = require('../db/');

module.exports = function makeRouterWithSockets(io) {

  // a reusable function
  function respondWithAllTweets(req, res, next) {
    client.query('SELECT * FROM tweets JOIN users ON users.id = tweets.user_id', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function (req, res, next) {
    client.query('SELECT * FROM users JOIN tweets ON users.id = tweets.user_id AND users.name = $1', [req.params.username], (err, results) => {
      if (err) return next(err);
      let tweetsForName = results.rows;
      console.log(tweetsForName);
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsForName,
        showForm: true,
        username: req.params.username
      });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function (req, res, next) {
    client.query('SELECT * FROM users JOIN tweets ON users.id = tweets.user_id AND tweets.id = $1', [req.params.id], (err, results) => {
      if (err) return next(err);
      let tweetsForID = results.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsForID // an array of only one element ;-)
      });
    });
  });

  // // create a new tweet
  router.post('/tweets', function (req, res, next) {
    client.query('SELECT id FROM users WHERE users.name = $1', [req.body.name], (err, Uresults) => {
      if (err) return next(err);
      client.query('INSERT INTO tweets (user_id, content) VALUES($1, $2) RETURNING *', [Uresults.rows[0].id, req.body.content], (err, results) => {
        if (err) return next(err);
        console.log(Uresults.rows[0].picture_url);
        io.sockets.emit('new_tweet', {name: req.body.name, content: req.body.content, picture_url: Uresults.rows[0].picture_url, id: results.rows[0].id});
        res.redirect('/');
      });
    });
  });

  // replaced this hard-coded route with general static routing in app.js
  router.get('/stylesheets/style.css', function (req, res, next) {
    res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  });

  return router;
};
