var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "home.html"
        })
        .when("/episodes", {
            templateUrl: "episodes.html"
        })
        .when("/reviews/:template", {
            templateUrl: function (urlattr) {
                return 'reviews/' + urlattr.template;
            }
        })
});

app.controller('homeCtrl', ['$scope', '$http', '$location', '$timeout', function ($scope, $http, $location, $timeout) {

    window.scrollTo(0, 0)

    $scope.data = [];

    $scope.flip = function (book, isFlipped, index) {
        $timeout(function () {
            book.flip = isFlipped;
        }, 250)
    }

    $scope.goTo = function (book) {
        $location.path('/reviews/' + book.template);
    }

    $http.get('./data/reviews.json').then(function (results) {
        $scope.data = results.data.map(function (item, i) {
            item['id'] = i;
            item['flip'] = false;
            item['created'] = new Date(item['created']);
            return item;
        });

    });

}]);

app.controller('episodeCtrl', ['$scope', '$http', '$sce', function ($scope, $http, $sce) {

    window.scrollTo(0, 0)

    $scope.embed = '';
    $scope.episodes = [];
    $scope.asides = [];

    $scope.close = function () {
        $scope.embed = '';
    }

    $scope.play = function (id) {
        $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + id + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
    }

    $http.get('./data/episodes.json').then(function (results) {
        $scope.episodes = results.data;
    });

    $http.get('./data/asides.json').then(function (results) {
        $scope.asides = results.data;
    });

}]);

app.directive("scrollpercent", function ($window) {
    return function (scope, element, attrs) {
        angular.element($window).bind("scroll", function () {
            var p = Math.round(100 * (scrollY / (document.getElementById('review-header').scrollHeight + document.getElementById('review-text').scrollHeight - screen.availHeight + 30)));
            if (p < 0) p = 0;
            if (p > 100) p = 100;
            document.getElementById('percentage').textContent = p + '%';
            // scope.$apply();
        });
    };
});

var percent = 0;
