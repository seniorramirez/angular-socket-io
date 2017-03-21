'use strict';

/* Controllers */

function AppCtrl($scope, socket) {

  // Socket listeners
  // ================
    $scope.users = [];
  socket.on('init', function (data) {
      console.log(data);
    $scope.name = data.name;
    $scope.users = data.users;
    $scope.idSocket = data.idSocket;
      console.log($scope.users);
  });

  socket.on('send:message', function (message) {
    $scope.messages.push(message);
  });
    
  socket.on('send:messageprivate', function (data) {
    console.log('messageprivate',data);
  });

  socket.on('change:name', function (data) {
    changeName(data.oldName, data.newName);
  });

  socket.on('user:join', function (data) {
    $scope.messages.push({
      user: 'chatroom',
      text: 'User ' + data.name + ' has joined.'
    });
    $scope.users.push({name:data.name,idSocket:data.idSocket});
  });

  // add a message to the conversation when a user disconnects or leaves the room
  socket.on('user:left', function (data) {
    $scope.messages.push({
      user: 'chatroom',
      text: 'User ' + data.name + ' has left.'
    });
    var i, user;
    for (i = 0; i < $scope.users.length; i++) {
      user = $scope.users[i];
      if (user === data.name) {
        $scope.users.splice(i, 1);
        break;
      }
    }
  });

  // Private helpers
  // ===============

  var changeName = function (oldName, newName) {
    // rename user in list of users
    var i;
    for (i = 0; i < $scope.users.length; i++) {
      if ($scope.users[i] === oldName) {
        $scope.users[i] = newName;
      }
    }

    $scope.messages.push({
      user: 'chatroom',
      text: 'User ' + oldName + ' is now known as ' + newName + '.'
    });
  }

  // Methods published to the scope
  // ==============================

  $scope.changeName = function () {
    socket.emit('change:name', {
      name: $scope.newName
    }, function (result) {
      if (!result) {
        alert('There was an error changing your name');
      } else {
        
        changeName($scope.name, $scope.newName);

        $scope.name = $scope.newName;
        $scope.newName = '';
      }
    });
  };

  $scope.messages = [];

  $scope.sendMessage = function () {
    socket.emit('send:message', {
      message: $scope.message
    });

    // add the message to our model locally
    $scope.messages.push({
      user: $scope.name,
      text: $scope.message
    });

    // clear message box
    $scope.message = '';
  };
    
    $scope.newChatRoom = function(idSocket){
        if(idSocket == $scope.idSocket){
            alert("no se puede chatear consigo mismo, no sea tonto.");
        }
        socket.emit('send:messageprivate',{
            idSocketTo : idSocket,
            idSocketForm: $scope.idSocket,
            nameForm: $scope.name
        })
    }
}
