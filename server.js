var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.port || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

//use handlebars for front-end
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");


// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/ArticleDb", {useNewUrlParse : true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/ArticleDb";

mongoose.connect(MONGODB_URI);

app.get("/scraped", function(req, res) {
    axios.get("http://www.echojs.com/").then(function(response) {
      var $ = cheerio.load(response.data);
      //console.log("scraped response:" + JSON.stringify(response.data, null, '\t')); 
      $("article h2").each(function(i, element) {
        
        var result = {};

        result.title = $(this)
        .children("a")
        .text();

        result.link = $(this)
        .children("a")
        .attr("href");

        result.summary = $(this)
        .children("a")
        .text();

        
        //console.log("the result");
        console.log("scraped result:" + JSON.stringify(result, null, '\t'));
        db.Article.create(result)
        .then(function(dbArticle) {
            console.log(dbArticle);
        })
        .catch(function(err) {
            console.log(err);
        });
      });

});
res.send("Scrape Complete");
});

//console.log(JSON.stringify(db.Article));
//Show all the article that is not saved

app.get("/",function(req, res){
    //console.log("here is the code");
    console.log('"here is the code" ' + JSON.stringify(db.Article));
    db.Article.find({"saved": false}).then(function(dbArticle){
        var hbsObject ={articles: dbArticle};
        res.render("index",hbsObject);
    }).catch(function(err){
        res.json(err);
    });
});

//get all the saved article to  from db
app.get("/saved", function(req, res) {
    // Grab every document in the Article collection
    db.Article.find({"saved": true})
        .populate("notes")
        .then(function(dbArticle) {
            console.log("from database"+dbArticle)
            var hbsObject= {articles: dbArticle}
            // If we were able to successfully find Article, send them back to the client
            res.render("saved",hbsObject);
        })
        .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});
//post when client needs to save
app.post("/saved/:id", function(req,res){
    db.Article.findOneAndUpdate({"_id": req.params.id},{"$set": {"saved":true}})
    .then(function(dbArticle){
        res.json(dbArticle+"situatioin changes");
    }).catch(function(err){
        res.json(err);
    });
});

app.post("/delete/:id",function(req,res){
    db.Article.findByIdAndDelete({"_id": req.params.id},{"set": {"saved":false}})
    .then(function(result){
        res.json(result);
    }).catch(function(err){
        res.json(err);
    });
});

//get one specific article from db
app.get("/articles/:id",function(req,res){
    db.Article.findOne({"_id": req.params.id })
    .populate("notes")
    .then(function(dbArticle) {
      res.json(dbArticle);
    }).catch(function(err) { res.json(err); });

});

//creat note for article
app.post("/article/:id",function(req,res){
    db.Note.create(req.boby).then(function(dbNote){
        return db.Article.findOneAndUpdate({"_id": req.params.id }, {"notes": dbNote._id }, { new: true });
    })
    .then(function(dbArticle){
        res.json(dbArticle);
    }).catch(function(err){
        res.json(err);
    });
});

// delete note
app.post("/deleteNote/:id", function(req, res){
    db.Note.remove({"_id": req.params.id})
      .then(function(dbArticle){
        res.json(dbArticle);
      })
      .catch(function(err) { 
        res.json(err) 
      });
});

//delete all the note and the colletion
 app.get("/clearall", function(req, res) {
     db.Article.remove({})
     .then(function(result) {
         res.json(result);
       })
       .catch(function(err) {
         res.json(err);
       });
 })


// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  