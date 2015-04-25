(function(angular) {
  'use strict';
var app = angular.module('app', ['ngResource']);

app.controller('Ctrl', ['$scope','$resource','$http', function($scope,$resource,$http) {
    $http.jsonp('http://www.reddit.com/r/jokes.json?limit=' + $scope.limit + '&jsonp=JSON_CALLBACK&subreddit=jokes')
      .success(function(res) {
        $scope.jokes = res.data.children
      })
    $scope.limit = 10
    $scope.continuous = false
    $scope.read = function(curIdx) {
      if (curIdx === undefined) {
        curIdx = 1
      }
      var joke = $scope.jokes[curIdx].data.title + " " + $scope.jokes[curIdx].data.selftext
      if (window.speechSynthesis !== undefined) {
        window.speechSynthesis.cancel()

        if ($scope.continuous) {
          nativetts(joke,function(){setTimeout(function(){$scope.read(curIdx+1)},1000)})
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
    $scope.play = function() {
      if (window.speechSynthesis !== undefined) {
        window.speechSynthesis.play()
      } else {
        window.aud.play()
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
          var u = new SpeechSynthesisUtterance(this.trim());
          window.speechSynthesis.speak(u);
          u.onend = cb
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
