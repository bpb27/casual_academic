var app = angular.module('myApp', ['ngRoute', 'djds4rce.angular-socialshare']);

app.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
  $routeProvider
    .when("/", {
      templateUrl: "home.html"
    })
    .when("/about", {
      templateUrl: "about.html"
    })
    .when("/episodes", {
      templateUrl: "episodes.html"
    })
    .when("/episodes/:episode", {
      templateUrl: "episode.html"
    })
    .when("/reviews", {
      templateUrl: "reviews.html"
    })
    .when("/reviews/:template", {
      templateUrl: "review.html"}
    );
});

app.run(function($FB) {
  $FB.init('1785189578409909');
});

app.controller('homeCtrl', ['$scope', '$location', '$timeout', '$http', '$rootScope', function($scope, $location, $timeout, $http, $rootScope) {
  window.scrollTo(0, 0);

  $scope.asides = [];
  $scope.episodes = [];
  $scope.episode = {};
  $scope.reviews = [];
  $scope.review = {};

  $scope.changeReview = function (change) {
    var index = $scope.reviews.indexOf($scope.reviews.filter(function(review){
      return review.title === $scope.review.title;
    })[0]) + change;

    if (index === -1)
      $scope.review = $scope.reviews[$scope.reviews.length - 1];
    else if (index === $scope.reviews.length)
      $scope.review = $scope.reviews[0];
    else
      $scope.review = $scope.reviews[index];
  }

  $scope.choose = function (item) {
    if ($scope.episode.episode === item.episode)
      $scope.listen(item);
    else
      $scope.episode = item;
  }

  $scope.listen = function (item) {
    $rootScope.$broadcast('podcast:play', item.soundcloud);
    if (item.liner)
      $location.path('/episodes/' + item.soundcloud);
  }

  $scope.read = function (item) {
    $location.path('/reviews/' + item.template.split('.')[0]);
  }

  $http.get('./data/entries.json').then(function(entries){
    $scope.episodes = entries.data.sort(function(a,b){
      return parseInt(b.episode) - parseInt(a.episode);
    });
    $scope.episode = $scope.episodes[0];
  });

  $http.get('./data/asides.json').then(function(asides) {
    $scope.asides = asides.data.sort(function(a,b){
      return parseInt(b.episode) - parseInt(a.episode);
    });
  });

  $http.get('./data/reviews.json').then(function(reviews) {
    $scope.reviews = reviews.data.reverse();
    $scope.review = $scope.reviews[0];
  });

}]);

app.controller('episodesCtrl', ['$scope', '$rootScope', '$sce', '$http', '$location', function($scope, $rootScope, $sce, $http, $location) {
  window.scrollTo(0, 0);

  $scope.episodes = [];

  $scope.play = function(item) {
    $rootScope.$broadcast('podcast:play', item.soundcloud);
    if (item.type === 'Episode') $location.path('/episodes/' + item.soundcloud);
  }

  $http.get('./data/entries.json').then(function(entries){
    $http.get('./data/asides.json').then(function(asides){
      $scope.episodes = entries.data.concat(asides.data).map(function(item){
        item.type = item.liner ? 'Episode' : 'Aside';
        return item;
      }).sort(function(a, b) {
        return new Date(a.created_at) - new Date(b.created_at);
      });
    });
  });

}]);

app.controller('singleEpisodeCtrl', ['$scope', '$http', '$rootScope', '$sce', '$routeParams', function($scope, $http, $rootScope, $sce, $routeParams) {
  window.scrollTo(0, 0);

  $scope.episode = {};
  $scope.furtherReading = '';
  $scope.url = 'http://www.thecasualacademic.com' + window.location.pathname;

  $scope.play = function (id) {
    $rootScope.$broadcast('podcast:play', id);
  }

  $http.get('./data/entries.json').then(function(entries){
    var episode = entries.data.filter(function(item){
      return item.soundcloud === $routeParams.episode;
    })[0];
    $scope.episode = episode;
    $scope.furtherReading = $sce.trustAsHtml(episode.further_reading.join(''));
  });

}]);

app.controller('reviewsCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
  window.scrollTo(0, 0);

  $scope.reviews = [];

  $scope.read = function (item) {
    $location.path('/reviews/' + item.template.replace('.html', ''));
  }

  $http.get('./data/reviews.json').then(function(reviews) {
    $scope.reviews = reviews.data.reverse();
  });

}]);

app.controller('reviewCtrl', ['$scope', '$sce', '$routeParams', '$http', function($scope, $sce, $routeParams, $http) {
  window.scrollTo(0, 0);

  $scope.review = {};
  $scope.template = '/reviews/' + $routeParams.template + '.html';
  $scope.url = 'http://www.thecasualacademic.com' + window.location.pathname;

  $http.get('./data/reviews.json').then(function(reviews) {
    $scope.review = reviews.data.filter(function(review){
      return review.template.split('.')[0] === $routeParams.template;
    })[0];
  });

}]);

app.controller('playerCtrl', ['$scope', '$sce', function($scope, $sce) {

  $scope.minimized = false;

  $scope.close = function () {
    $scope.embed = '';
  }

  $scope.minimize = function () {
    $scope.minimized = !$scope.minimized;
  }

  $scope.getEmbed = function (id) {
    return $sce.trustAsHtml('<iframe width="100%" height="80" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + id + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
  }

  $scope.$on('podcast:play', function (event, id) {
    $scope.embed = $scope.getEmbed(id);
    $scope.minimized = false;
  });

}]);

app.directive("scrollpercent", function ($window) {
  return function(scope, element, attrs) {
    angular.element($window).bind("scroll", function () {
      if (document.getElementById('review-header') && document.getElementById('review-text')) {
        var p = Math.round(100 * (scrollY / (document.getElementById('review-header').scrollHeight + document.getElementById('review-text').scrollHeight - screen.availHeight + 30)));
        if (p < 0)
          p = 0;
        if (p > 100)
          p = 100;
        document.getElementById('percentage').textContent = p + '%';
      }
    });
  };
});

var percent = 0;
