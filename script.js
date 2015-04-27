(function(angular) {
  'use strict';
var app = angular.module('app', ['ngResource']);

app.controller('Ctrl', ['$scope','$resource','$http', function($scope,$resource,$http) {
  $scope.getJokes = function(sub) {
    $scope.stop()

    $http.jsonp('http://www.reddit.com/r/' + sub + '.json?limit=100&jsonp=JSON_CALLBACK&subreddit=jokes')
      .success(function(res) {
        $scope.jokes = res.data.children.reduce(function(prev,cur) {
          var ids;
          if (localStorage['ids'] === null || localStorage['ids'] === undefined || localStorage['ids'] === "") {
            ids = [];
          } else {
            ids = JSON.parse(localStorage["ids"]);
          }
          console.log(cur.data.id)
          console.log(!~ids.indexOf(cur.data.id))
          console.log(!$scope.omitRedundancies)
          if (!~ids.indexOf(cur.data.id) || !$scope.omitRedundancies) {
            prev.push(cur)
          }
          return prev
        },[])
      })
  }
  $scope.omitRedundancies = true
  if (typeof(Storage) != "undefined") {
    if (localStorage.getItem("firstTime") === null) {
      $scope.firstTime = true
      localStorage.setItem("firstTime", false);
    } else {
      $scope.firstTime = false
    }
  }
  $scope.continuous = true
  $scope.played = []
  $scope.curPlay = 0
  $scope.read = function(curIdx,clicked,curPlay) {
    if (clicked) {
      $scope.stopped = false
      $scope.curPlay +=1
      curPlay = $scope.curPlay
      $scope.played = []
      if (window.speechSynthesis !== undefined) {
        window.speechSynthesis.cancel()
      }
    }
    if (!$scope.stopped) {


      if ($scope.played.some(function(cur) {return cur === curIdx}) ||
        $scope.curPlay !== curPlay) {
          return
      } else {
        $scope.played.push(curIdx)
      }

      // add id to local storage
      addIdToLocalStorage($scope.jokes[curIdx].data.id)


      $scope.jokes[curIdx].jokeClass="text-warning"
      var joke = $scope.jokes[curIdx].data.title + ". " + $scope.jokes[curIdx].data.selftext
      if (window.speechSynthesis !== undefined) {
        if ($scope.continuous) {
          nativetts(joke,function(){
            setTimeout(function(){
              $scope.read(curIdx+1,false,curPlay)
              $scope.$apply()
            },1000)
            })
        } else {
          nativetts(joke)
        }

      } else {
        if (window['aud'+$scope.curPlay] !== undefined) {
          window['aud'+$scope.curPlay].pause()
        }
        if ($scope.continuous) {
          apitts(joke,function(){setTimeout(function(){$scope.read(curIdx+1,false,curPlay);$scope.$apply()},1000)})
        } else {
          apitts(joke)
        }

      }

    }
  }
  $scope.stop = function() {
    $scope.stopped = true
    ++$scope.curPlayed
    if (window.speechSynthesis !== undefined) {
      window.speechSynthesis.cancel()
    } else {
      window.aud.pause()
    }
  }
  $("[name='my-checkbox']").bootstrapSwitch({
    size:'mini'
  })
  .on('switchChange.bootstrapSwitch', function(event, state) {
    $scope.$apply($scope.continuous = state)
  })
  function nativetts(txt,cb) {
    var arr = [];
    var element = this;
    while (txt.length > 0) {
        arr.push(txt.match(pattRegex)[0]);
        txt = txt.substring(arr[arr.length - 1].length);
    }
    $.each(arr, function () {
        var u = new SpeechSynthesisUtterance(this.trim())
        u.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex'; })[0];
        window.speechSynthesis.speak(u)
        u.onend = cb
    })

  }
  $scope.getLink = function(idx) {
    return 'http://reddit.com/'+$scope.jokes[idx].data.permalink
  }
  $scope.getJokes('jokes')

}])
})(window.angular);
var chunkLength = 150;
var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
var u = new SpeechSynthesisUtterance()
u.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex'; })[0];

function apitts(txt,cb) {
  if (window.aud !== undefined && window.aud !== null) {window.aud.pause()}
  window.aud = new Audio("http://tts-api.com/tts.mp3?q=" + encodeURIComponent(txt))
  window.aud.play()
  window.aud.addEventListener('ended',cb, false)
}
function addIdToLocalStorage(id) {
  var ids;
  if (localStorage['ids'] === null || localStorage['ids'] === undefined || localStorage['ids'] === "") {
    ids = [];
  } else {
    ids = JSON.parse(localStorage["ids"]);
  }
  if (!~ids.indexOf(id)) {
    ids.push(id)
    localStorage["ids"] = JSON.stringify(ids);
  }
}
