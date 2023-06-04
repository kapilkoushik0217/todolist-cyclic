const dotenv = require('dotenv');
dotenv.config({path:'config.env'});
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const PORT=process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
 
// // make a connection with the database
// mongoose.connect("mongodb+srv://kapilkoushik0217:Kapil@cluster0.ibupfvm.mongodb.net/todolistDB");
 
// create a schema
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  }
});
 
// create a model
const Item = mongoose.model("Item", itemsSchema);
 
//create a document
const item1 = new Item({
  name: "Hello !",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});
 
//create an array of documents
const defaultItems = [item1, item2, item3];
 
const listSchema = {
  name: String,
  items: [itemsSchema],
};
 
const List = mongoose.model("List", listSchema);
 
app.get("/", async (req, res) => {
  if(req.params.customListName === "favicon.ico") return;
  await Item.find({})
    .then(function (founditems) {
      if (founditems.length === 0) {
        //   Insert the array of documents in the database and save them
        Item.insertMany(defaultItems)
          .then(function () {
            res.redirect("/");
          })
          .catch(function () {
            console.log("Error inserting to database..");
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: founditems });
      }
    })
    .catch(function () {
      console.log("errrrror");
    });
});
 
app.post("/", function(req, res){
 
  const ourItem = req.body.newItems;
  const ourListName=req.body.list;
  const item = new Item({
    name: ourItem
  })
  if(ourListName=="Today") {
  item.save().then(function(){
    res.redirect("/");
  });
}
  else{
    List.findOne({name:ourListName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save().then(function(){
        res.redirect("/"+ourListName);
      });

    })
    .catch(function(err){
      console.log(err);
    });
  }
});
 
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
 
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        res.redirect("/");
      })
      .catch(function () {
        console.log("delete error");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function (foundList) {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log("err in delete item from custom list");
      });
  }
});
 
app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
 
  await List.findOne({ name: customListName })
    .then(async function (foundList) {
      if (!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
 
        await list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}),

 mongoose.set("strictQuery", false);
 const connectDB=async()=>{
   try {
     const conn=await mongoose.connect('mongodb+srv://kapilkoushik0217:Kapil@cluster0.ibupfvm.mongodb.net/todolistDB?retryWrites=true&w=majority');
     console.log("MongoDB Connected: ${conn.connection.host}");
   } catch (err) {
     console.error(err.message);
     process.exit(1);
   }
 }

connectDB().then(function(){
  app.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
  });
});