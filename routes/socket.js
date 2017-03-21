// Keep track of which names are used so that there are no duplicates
var userNames = (function () {
  var names = {};

  var claim = function (name,idSocket) {
    if (!name || names[name]) {
      return false;
    } else {
      names[name] = idSocket;
      return true;
    }
  };

  // find the lowest unused "guest" name and claim it
  var getGuestName = function (idSocket) {
    var name,
      nextUserId = 1;

    do {
      name = 'Guest ' + nextUserId;
      nextUserId += 1;
    } while (!claim(name,idSocket));

    return name;
  };

  // serialize claimed names as an array
  var get = function () {
    var res = [];
    
    for (user in names) {
      res.push({name:user,idSocket:names[user]});
    }
      console.log(res);
    return res;
  };

  var free = function (name) {
    if (names[name]) {
      delete names[name];
    }
  };

  return {
    claim: claim,
    free: free,
    get: get,
    getGuestName: getGuestName
  };
}());

// export function for listening to the socket
module.exports = function (socket) {
    
  var name = userNames.getGuestName(socket.id);
    

  // send the new user their name and a list of users
  socket.emit('init', {
    name: name,
    users: userNames.get(),
    idSocket:socket.id,
  });

  // notify other clients that a new user has joined
  socket.broadcast.emit('user:join', {
    name: name,
    idSocket: socket.id  
  });

  // broadcast a user's message to other users
  socket.on('send:message', function (data) {
    socket.broadcast.emit('send:message', {
      user: name,
      text: data.message
    });
  });
    
  // messagePrivate 
  socket.on('send:messageprivate',function(data){
    io.sockets.socket(data.idSocketTo).emit('send:messageprivate',{
      nameForm: data.nameForm,
      message: 'Hola perra',
      idSocketTo : data.idSocketTo
    });       
  });

  // validate a user's name change, and broadcast it on success
  socket.on('change:name', function (data, fn) {
    if (userNames.claim(data.name)) {
      var oldName = name;
      userNames.free(oldName);

      name = data.name;
      
      socket.broadcast.emit('change:name', {
        oldName: oldName,
        newName: name
      });

      fn(true);
    } else {
      fn(false);
    }
  });

  // clean up when a user leaves, and broadcast it to other users
  socket.on('disconnect', function () {
    socket.broadcast.emit('user:left', {
      name: name
    });
    userNames.free(name);
  });
};
