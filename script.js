(function(angular) {
  'use strict';
var app = angular.module('app', ['ngResource']);

app.controller('Ctrl', ['$scope','$resource','$http', function($scope,$resource,$http) {
  var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
  var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
  var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
      // At least Safari 3+: "[object HTMLElementConstructor]"
  var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
  var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
  if (!(isChrome || isFirefox)) {
    $scope.message = "This app is only supported by Chrome and Firefox. Use at your own discretion."
    $scope.badBrowser = true
  }
  $scope.getJokes = function(limit) {
    $http.jsonp('http://www.reddit.com/r/jokes.json?limit=100&jsonp=JSON_CALLBACK&subreddit=jokes')
      .success(function(res) {
        $scope.jokes = res.data.children
      })
  }
  $scope.getJokes(10)
  $scope.continuous = true
  $scope.played = []
  $scope.read = function(curIdx,clicked) {
  if (clicked) {
    $scope.played = []
    if (window.speechSynthesis !== undefined) {
      window.speechSynthesis.cancel()
    }
  }
  if ($scope.played.some(function(cur) {return cur === curIdx})) {
    return
  } else {
    $scope.played.push(curIdx)
  }


  $scope.jokes[curIdx].jokeClass="alert alert-success"
  var joke = $scope.jokes[curIdx].data.title + " " + $scope.jokes[curIdx].data.selftext
  if (window.speechSynthesis !== undefined) {


    if ($scope.continuous) {

      nativetts(joke,function(){
        setTimeout(function(){
          $scope.read(curIdx+1)
          $scope.jokes[curIdx].jokeClass="text-warning"
          $scope.$apply()
        },1000)
        })
    } else {
      nativetts(joke)
    }

  } else {
    if (window.aud !== undefined) {
      window.aud.pause()
    }
    if ($scope.continuous) {
      apitts(joke,function(){setTimeout(function(){$scope.read(curIdx+1)},1000)})
    } else {
      apitts(joke)
    }

  }
  }
  $scope.pause = function() {
    if (window.speechSynthesis !== undefined) {
      window.speechSynthesis.pause()
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
        u.onend = cb
        window.speechSynthesis.speak(u)
    })

  }
}])
})(window.angular);
var chunkLength = 150;
var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');


function apitts(txt,cb) {
  window.aud = new Audio("http://tts-api.com/tts.mp3?q=" + encodeURIComponent(txt))
  window.aud.play()
  window.aud.addEventListener('ended',cb, false)
}
