 // app/routes.js

// grab the nerd model we just created
var Car        = require('./car');
var User     = require('./user');
var Activity = require('./activity');    

var fs          = require('fs');
var bcrypt      = require('bcrypt-nodejs');
var jwt         = require('jsonwebtoken');
var _           = require('lodash');

module.exports = function(app) {

    //LOGIN
    

    // WORDS
    // Insert a word singly
    app.post('/api/words', function(req, res) {
        
        // create a new user
        var newWord = Word({
          type: req.body.type,
          word: req.body.word,
          polarity: req.body.polarity
        });

        // we need to make sure that we don't already have a user 
        // signed up with this email address
        Word.find({
            word: req.body.word
        }, function (err, words) {
            if (err) 
                res.json({
                    success: false,
                    message: err
                });

            if (words.length > 0) {
                res.json({
                    success: false,
                    message: 'Word already exists',
                    words: words
                });
            }
            else {

                // save the word
                newWord.save(function(err) {
                    if (err) {
                        return res.json({ 
                            success: false, 
                            message: 'error saving word: ' + err
                        });
                    } 

                    // now let's look them up!
                    Word.findOne(
                        { word: req.body.word},
                        function(err, word){
                            if (err){
                                res.json({ 
                                    message: 'Error occured: ' + err,
                                    success: false
                                });
                            }

                            if (!word) {
                                res.json({ 
                                    message: 'Word doesnt exist',
                                    success: false
                                }); 
                            } else {

                                res.json({ 
                                    success: true, 
                                    message: 'word created successfully!',
                                    word: word
                                });
                            }
                        });
                });
            } 
        });
    });

    // get information on a word
    app.get('/api/words/:word', function(req, res) {
        Word.find({
            word: req.params.word
        }, function(err, words){

            if (err) {
                return res.json({ message: 'No words exists for this word'});
            }

            res.json(words);
        });
    });

    // ARTICLES
    // create a new article
    app.post('/api/articles', function(req, res) {
        
        //get the current date
        var date = new Date();

        // create a new article
        var newArticle = Article({
          source: req.body.source,
          headline: req.body.headline,
          date: date
        });

        // we need to make sure that we don't already have this article
        // signed up with this email address
        Article.find({
            source: req.body.source,
            headline: req.body.headline,
        }, function (err, articles) {
            if (err) 
                res.json({
                    success: false,
                    message: err
                });

            if (articles.length > 0) {
                res.json({
                    success: false,
                    message: 'Article already exists',
                    articles: articles
                });
            }
            else {

                // save the article
                newArticle.save(function(err) {
                    if (err) {
                        return res.json({ 
                            success: false, 
                            message: 'error saving article: ' + err
                        });
                    } 

                    // now let's look them up!
                    Article.findOne({ 
                        source: req.body.source,
                        headline: req.body.headline
                        },
                        function(err, article){
                            if (err){
                                res.json({ 
                                    message: 'Error occured: ' + err,
                                    success: false
                                });
                            }

                            if (!article) {
                                res.json({ 
                                    message: 'Article doesnt exist',
                                    success: false
                                }); 
                            } else {

                                res.json({ 
                                    success: true, 
                                    message: 'article created successfully!',
                                    article: article
                                });
                            }
                        });
                });
            } 
        });
    });

    // get an article
    app.get('/api/articles/:source/:headline', function(req, res) {
        Article.find({
            source: req.params.source,
            headline: req.params.headline
        }, function(err, articles){

            if (err) {
                return res.json({ message: 'Article not found!'});
            }

            //we need find the most popular emojis in the article
            for(var count = 0; count < articles.length; count ++) {
                var popularEmojis = getMostPopularEmojis(articles[count]);
                articles[count].popularEmojis = [];
                articles[count].popularEmojis = popularEmojis;

                console.log('most popular! ' );
                console.log(popularEmojis);
            }

            res.json({
                articles: articles,
                popularEmojis: popularEmojis
            });
        });

        function getMostPopularEmojis(article) {
            console.log(article.emojis);

            // sort the list of emojis first
            article.emojis = _.orderBy(article.emojis, ['count'], ['desc']);

            // if there are less than 3 emojis, then fuck it, return all of them
            if (article.emojis.length < 3) {
                return article.emojis;
            }

            // If there are more than 3 emojis, then only take 3 emojs
            return _.take(article.emojis, 3);
        }
    });

    //EMOJIS
    // add an emoji to an article
    app.post('/api/emojis', function(req, res) {
        
        Article.find({
            source: req.body.source,
            headline: req.body.headline,
        }, function (err, articles) {

            if (err) 
                res.json({
                    success: false,
                    message: err
                });

            if (articles.length == 1) {
                // then we have the article we need to add the emoji to
                var article = articles[0];

                // see if there is an instance of this emoji in the article already
                var emojiIndex = _.findIndex(
                    article.emojis, 
                    { 'emoji': req.body.emoji});


                var emojis = article.emojis;

                // if the index is greater than -1, then we need to increment the count
                if (emojiIndex > -1) { 
                    emojis[emojiIndex].count = emojis[emojiIndex].count + 1; 
                }
                else {
                    console.log('we dont have this emoji already');
                    article.emojis[article.emojis.length] = {
                        'emoji': req.body.emoji,
                        'count': 1
                    };
                }

                Article.update({
                    source: article.source,
                    headline: article.headline
                }, {
                    emojis: emojis
                }, function(err, numberAffected, rawResponse) {
                    if (err){
                        res.json({ 
                            success: false, 
                            message: 'error saving emoji to article: ' + err
                        });  
                    } else {
                        res.json({ 
                            success: true, 
                            message: 'emoji saved to article successfully!',
                            article: article,
                        }); 
                    }
                });
            }
        });
    });
};
