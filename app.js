const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/date.js');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + "/public"));

const day = date.getDate();

//atlas info
mongoose.connect("mongodb+srv://<name>:<password>@cluster/todolistDB");



/************************Item***********************/
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }

});


const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaulItems = [item1, item2, item3];



/************************List***********************/
const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  items: [itemsSchema]

});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find(function(err, items) {

    if (items.length === 0) {
      Item.insertMany(defaulItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Added  succesfully.");
        }
      });
      res.redirect("/");
    } else {
      List.find(function(err, results) {
        if (err) {
          console.log(err);
        } else {
          res.render("list", {
            listTitle: day,
            newListItems: items,
            dropDownList: results,
            type: "item"
          });
        }

      });
    }
  });
});

/************************post home route when the + is clicked adds item or list***********************/

app.post("/", async function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === day) {
    try {
      await item.save();
    } catch (err) {
      console.log(err);

    }
    res.redirect("/");

  } else if (listName === "My Lists") {
    const newList = new List({
      name: _.capitalize(itemName),
      items: []
    });
    try {
      await newList.save()
    } catch (e) {
      console.log(e);

    }
    res.redirect("/update/lists")

  } else {
    List.findOne({
      name: listName
    }, async function(err, foundList) {
      try {

        foundList.items.push(item);
        await foundList.save();


      } catch (err) {
        console.log(err);

      }
      res.redirect("/" + listName);
    });
  }

});


/************************post delete when the checkbox is clicked delets item or list***********************/

app.post("/delete/list", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("succesfully deleted checked item");
        res.redirect("/");
      }
    });

  } else if (listName === "My Lists") {
    List.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("succesfully deleted checked item");
        res.redirect("/update/lists");
      }
    });

  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

/************************adding another list and getting the page of the list***********************/
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err && !foundList) {
      //Create a new list
      const list = new List({
        name: customListName,
        items: []
      });
      list.save();
      res.redirect("/" + customListName);

    } else {
      //show an existing list.
      List.find(function(err, results) {
        if (err) {
          console.log(err);
        } else {
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
            dropDownList: results,
            type: "item"
          });
        }

      });


    }
  });
});

/************************post request when we want to delete or add a list when the button is clicked***********************/
app.post("/update/lists", function(req, res) {
  res.redirect("/update/lists");
});


/************************get page /update/lists***********************/
app.get("/update/lists", function(req, res) {
  List.find(function(err, foundList) {
    if (!err) {
      res.render("list", {
        listTitle: "My Lists",
        newListItems: foundList,
        dropDownList: foundList,
        type: "list"
      });
    }
  })
});

/************************listining for port***********************/
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started succesfully.");
});
