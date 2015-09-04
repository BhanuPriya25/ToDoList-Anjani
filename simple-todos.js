Tasks = new Mongo.Collection("tasks");
if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("tasks"); //after "Meteor remove autopublish"
  Template.body.helpers({
      tasks: function () {
        if (Session.get("hideCompleted")) {
          // If hide completed is checked, filter tasks
          return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
        }
        else {
          // Otherwise, return all of the tasks
          return Tasks.find({}, {sort: {createdAt: -1}});
        }
      },
      hideCompleted: function () {
        return Session.get("hideCompleted");
      },
      incompleteCount: function () {
        return Tasks.find({checked: {$ne: true}}).count();
      }
  });
  Template.body.events({
    "submit .new-task": function(event) {
      // Prevent default browser form submit
      //console.log(event)
      event.preventDefault();
      // Get value from form element
      var text = event.target.text.value;

      // Insert a task into the collection
      // Tasks.insert({
      //   text: text,
      //   createdAt: new Date(), // current time
      //   owner: Meteor.userId(),           // _id of logged in user
      //   username: Meteor.user().username  // username of logged in user
      // }); before "Meteor remove insecure"
      Meteor.call("addTask", text); //after "meteor remove insecure"
      // Clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }

  });
  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });
  Template.task.events({
      "click .toggle-checked": function () {

      // Set the checked property to the opposite of its current value
        // Tasks.update(this._id, {
        //   $set: {checked: ! this.checked}
        // }); before "Meteor remove insecure"
         Meteor.call("setChecked", this._id, ! this.checked);//after "meteor remove insecure"
      },

      "click .delete": function () {
        //Tasks.remove(this._id);// before "meteor remove insecure" command
        Meteor.call("deleteTask", this._id)//Call method after "meteor remove insecure" command
      },
      "click .toggle-private": function () {
        Meteor.call("setPrivate", this._id, ! this.private);
      }

    });
    Accounts.ui.config({
      passwordSignupFields: "USERNAME_ONLY"
    });
}
//********* Method Defined for "security and Optimistic UI" *******
Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
    else if (!task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
    else{
    Tasks.remove(taskId);
    }
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});
//*********End of the code Method Defined for "Security and Optimistic UI" *******
if (Meteor.isServer) {
  Meteor.startup(function() {
    // code to run on server at startup
  });
  // This code only runs on the server
  //******after "Meteor remove autopublish"*****
  // This code only runs on the server

// Only publish tasks that are public or belong to the current user
Meteor.publish("tasks", function () {
  return Tasks.find({$or:[{ private: {$ne: true} },{ owner: this.userId } ] });
});
  //****** End Here *********************
}
