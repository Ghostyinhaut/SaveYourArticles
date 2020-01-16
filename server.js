var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

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
var exphbs= require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/ArticleDb", {useNewUrlParse : true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoartnews";

mongoose.connect(MONGODB_URI);

app.get("/scraped", function(req, res) {
    axios.get("http://www.artnews.com/category/news/").then(function(response) {
      var $ = cheerio.load(response.data);
      //console.log("scraped response:" + JSON.stringify(response.data, null, '\t')); 
      $("story").each(function(i, element) {
        var result = {};

        result.title = "cascasd";
    
        result.link = "caffarfwarfrad";

        result.summary = "dfvsdfvearveare";
        
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
        .populate("note")
        .then(function(dbArticle) {
            console.log(dbArticle)
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
    db.Article.findOneAndUpdate({"_id": req.params.id},{"$set": {"save":false}})
    .then(function(dbArticle){
        res.json(dbArticle);
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


// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  