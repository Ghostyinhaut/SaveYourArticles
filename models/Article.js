var mongoose = require("mongoose");

//save referrnce to the schema constructor
var Schema = mongoose.Schema;

var articleSchema = new Schema({
    title: {
        type :String,
        requried: true
    },
    link: {
        type :String,
        require :true
    },
    summary: {
        type: String,
        requried: true
    },
    saved: {
        type: Boolean,
        default: false
    },
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }
});






var Article = mongoose.model("Article",articleSchema);
module.exports = Article;