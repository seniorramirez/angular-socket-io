// Keep track of which names are used so that there are no duplicates
var userNames = (function () {
  var names = {};

  var claim = function (name,socket) {
    if (!name || names[name]) {
      return false;
    } else {
      names[name] = socket;
      return true;
    }
  };

  // find the lowest unused "guest" name and claim it
  var getGuestName = function (socket) {
    var name,
      nextUserId = 1;

    do {
      name = 'Guest ' + nextUserId;
      nextUserId += 1;
    } while (!claim(name,socket));

    return name;
  };

  // serialize claimed names as an array
  var get = function () {
    var res = [];
    
    for (user in names) {
      res.push({name:user,idSocket:names[user].id});
    }
      console.log(res);
    return res;
  };
  
  var getSocket = function (idSocket){
    for (user in names) {
      if(names[user].id == idSocket){
        return names[user];
      }
    }
  }
  
  var free = function (name) {
    if (names[name]) {
      delete names[name];
    }
  };

  return {
    claim: claim,
    free: free,
    get: get,
    getGuestName: getGuestName,
    getSocket: getSocket
  };
}());

// export function for listening to the socket
module.exports = function (socket) {
    
  var name = userNames.getGuestName(socket);
    

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
    var socketEppah = userNames.getSocket(data.idSocketTo);
    
    socketEppah.emit('send:messageprivate',{
      nameForm: data.nameForm,
      message: 'Hola perra',
      idSocketTo : data.idSocketForm
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
