//FB Open Graph SDK
jQuery(document).ready(function() {
  jQuery.ajaxSetup({ cache: true });
  jQuery.getScript('//connect.facebook.net/en_UK/all.js', function(){
    FB.init({
      appId: '515935555178571',
    });     
    jQuery('#loginbutton,#feedbutton').removeAttr('disabled');
  });
});

var j = jQuery.noConflict();

var fb = new Firebase("https://virtual-survivor.firebaseio.com");
var player = fb.child('player');
var counter = fb.child('counter');
var highScore = fb.child('highScore');
var highScorer = fb.child('highScorer');
var currentPlayer = fb.child('currentPlayer');
var userID;
var current;
var profilePicture;
var facebookToken;
var scoreBoard = new Firebase('https://virtual-survivor.firebaseio.com/scoreBoard');

//Firebase authentication, get userID
var auth = new FirebaseSimpleLogin(fb, function(error, user) {
  if (error) {
    j('#container').hide();
    j('#login').show();
    // an error occurred while attempting login
    console.log(error);
  } else if (user) {
    // user authenticated with Firebase
    facebookToken = user.accessToken;
    console.log('User ID: ' + user.uid + ', Provider: ' + user.provider);
    j('#container').show();
    j('#login').hide();
  } else {
    j('#container').hide();
    j('#login').show();
    // user is logged out
    auth.login('facebook', {
      access_token: facebookToken
    });
  }
  userID = user.id;
  nameQuery();
});

j(document).ready(function(){    
  j('#login').click(function(){
    auth.login('facebook', {
      access_token: facebookToken
    });
  });
});


//FB open graph information, pulled from userID
function nameQuery(){
  FB.api('/' + userID, function(user) {
    current = user.first_name + " " + user.last_name.charAt(0);
    currentPlayer.set(current);
    profilePicture = 'http://graph.facebook.com/' + userID + '/picture';
    scoreBoardUpdate();
    console.log(current);
  });
}

//JSON database, not sure what to do with this yet
function scoreBoardUpdate(){
  var lastMoves = scoreBoard.push();
  lastMoves.set({user_id: userID, name: current, profilePic: profilePicture});
}

//game stuff
var you;
var first = true;
var other;
var start = new Date().getTime(),
topScore = 0.0,
time = 0,
elapsed = 0.0;

function instance(){
  time += 100;

  elapsed = Math.floor(time / 100) / 10;
  if(Math.round(elapsed) == elapsed) { elapsed += '.0'; }

  var diff = (new Date().getTime() - start) - time;
  window.setTimeout(instance, (100 - diff));

  j('#timer').text(elapsed);
}

window.setTimeout(instance, 100);



j(document).ready(function() {
  highScore.once('value',function(dataSnapshot) {
    topScore = dataSnapshot.val();
  });

  j('#count').click(function(){
    auth.logout();
  });

  player.once('value',function(dataSnapshot) {
    you = dataSnapshot.val();

    if(you){
      player.set(false);
    }
    else{
      player.set(true);
    }
  }); 
});

function changeval(value) {
    counter.transaction(function(current) {
        return current + value;
    });
}

player.on('value',function(dataSnapshot) {
    //ignore initial variable
    if(first){                
      first = false;
      return;
    };

    //get updated variable
    other = dataSnapshot.val();     

    if ( you === other ){
      console.log(current +","+ elapsed);

      if( elapsed > topScore ){
        j('#endgame').show();
        j('#game').hide();
        j('#lost').text('win');
        j('#score').text("You set a new high score with " + elapsed + " seconds!");
        highScorer.set(current);
        highScore.set(elapsed);
      }
      else{
        j('#lost').text('lose');
        j('#endgame').show();
        j('#game').hide();
        j('#score').text('You survived for ' + elapsed + ' seconds.');
      }
      var addTime = scoreBoard.push();
      addTime.set({time: elapsed});
      changeval(1);
    };
});


//interface stuff
counter.on('value',function(dataSnapshot) {
      var data = dataSnapshot.val();
      j('#count').text(data);
  });

highScore.on('value',function(dataSnapshot) {
      j('#topScore').text(dataSnapshot.val());
  });

highScorer.on('value',function(dataSnapshot) {
      j('#topScorer').text(dataSnapshot.val());
  });
