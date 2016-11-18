var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "home.html"
        })
        .when("/episodes", {
            templateUrl: "episodes.html"
        })
        .when("/episodes/:episode", {
            templateUrl: "episode.html"
        })
        .when("/reviews/:template", {
            templateUrl: function (urlattr) {
                return 'reviews/' + urlattr.template;
            }
        })
});

app.controller('homeCtrl', ['$scope', '$location', '$timeout', 'EntryService', function ($scope, $location, $timeout, EntryService) {

    window.scrollTo(0, 0)

    $scope.data = [];

    $scope.flip = function (book, isFlipped, index) {
        $timeout(function () {
            book.flip = isFlipped;
        }, 250)
    }

    $scope.read = function (book) {
        $location.path('/reviews/' + book.template);
    }

    $scope.listen = function (book) {
        $location.path('/episodes/' + book.podcast.soundcloud);
    }

    EntryService.getEntries(function (results) {
        var entries = results.slice(0);
        $scope.data = entries.map(function (item) {
            item['flip'] = false;
            item['created_at_date'] = new Date(item['created_at']);
            return item;
        }).sort(function (a, b) {
            if (a.created_at_date < b.created_at_date) return -1;
            if (a.created_at_date > b.created_at_date) return 1;
            return 0;
        }).reverse().slice(0, 4)
    });

}]);

app.controller('episodesCtrl', ['$scope', '$sce', '$http', 'EntryService', function ($scope, $sce, $http, EntryService) {

    window.scrollTo(0, 0);

    $scope.embed = '';
    $scope.episodes = [];
    $scope.asides = [];

    EntryService.getEntries(function (entries) {
        $scope.episodes = entries;
    });

    $http.get('./data/asides.json').then(function (results) {
        $scope.asides = results.data.sort(function (a, b) {
            if (a.episode < b.episode) return -1;
            if (a.episode > b.episode) return 1;
            return 0;
        }).reverse();
    });

    $scope.close = function () {
        $scope.embed = '';
    }

    $scope.play = function (id) {
        $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + id + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
    }

}]);

app.controller('singleEpisodeCtrl', ['$scope', '$sce', '$routeParams', 'EntryService', function ($scope, $sce, $routeParams, EntryService) {

    window.scrollTo(0, 0);

    $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + $routeParams.episode + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');

    $scope.episode = {};

    EntryService.getEntry($routeParams.episode).then(function (entry) {
        console.log(entry);
        $scope.episode = entry;
        $scope.$apply();
    })

}]);

app.service('EntryService', ['$http', function ($http) {

    this.loaded = [];

    this.getEntries = function (successHandler) {
        if (this.loaded.length) {
            var copiedList = this.loaded.slice(0);
            successHandler(copiedList);
        } else {
            $http.get('./data/entries.json').then(function (results) {
                this.loaded = results.data;
                successHandler(results.data);
            }.bind(this));
        }
    }

    this.getEntry = function (soundcloudId) {
        return new Promise(function (callback) {
            return this.getEntries(function (entries) {
                var result = entries.filter(function (entry) {
                    return entry.podcast.soundcloud === parseInt(soundcloudId);
                });
                callback(result[0]);
            })
        }.bind(this), function (error) {
            console.log(error);
        })
    }

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
