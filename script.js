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
  if (!(isChrome || isFirefox || isSafari)) {
    $scope.message = "This app is only supported by Chrome, Firefox, and Safari. Use at your own discretion."
    $scope.badBrowser = true
  }
  $scope.getJokes = function(limit) {
    $http.jsonp('http://www.reddit.com/r/jokes.json?limit=100&jsonp=JSON_CALLBACK&subreddit=jokes')
      .success(function(res) {
        $scope.jokes = res.data.children
      })
  }
  if (typeof(Storage) != "undefined") {
    if (localStorage.getItem("firstTime") === null) {
      $scope.firstTime = true
      localStorage.setItem("firstTime", false);
    } else {
      $scope.firstTime = false
    }
  }
  $scope.getJokes(10)
  $scope.continuous = true
  $scope.played = []
  $scope.curPlay = 0
  $scope.m = 1
  $scope.read = function(curIdx,clicked,curPlay) {
    if (clicked) {
      $scope.curPlay +=1
      curPlay = $scope.curPlay
      $scope.played = []
      if (window.speechSynthesis !== undefined) {
        window.speechSynthesis.cancel()
      }
    }

    if ($scope.played.some(function(cur) {return cur === curIdx}) ||
      $scope.curPlay !== curPlay) {
        return
    } else {
      $scope.played.push(curIdx)
    }

    $scope.jokes[curIdx].jokeClass="text-warning"
    var joke = $scope.jokes[curIdx].data.title + " " + $scope.jokes[curIdx].data.selftext
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
  $scope.pause = function() {
    if (window.speechSynthesis !== undefined) {
      window.speechSynthesis.pause()
    } else {
      window['aud'+$scope.curPlay].pause()
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
}])
})(window.angular);
var chunkLength = 150;
var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
var u = new SpeechSynthesisUtterance()
u.voice = u.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex'; })[0];

function apitts(txt,cb) {
  window.aud = new Audio("http://tts-api.com/tts.mp3?q=" + encodeURIComponent(txt))
  window.aud.play()
  window.aud.addEventListener('ended',cb, false)
}
