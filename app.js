var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

app.config(function ($routeProvider) {
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
        .when("/reviews/:template", {
            templateUrl: function (urlattr) {
                return 'reviews/' + urlattr.template;
            }
        })
});

app.controller('homeCtrl', ['$scope', '$location', '$timeout', 'EntryService', function ($scope, $location, $timeout, EntryService) {

    window.scrollTo(0, 0);

    $scope.book = {};
    $scope.data = [];
    $scope.featured = {};
    $scope.featuredTitle = "A Primer to Borges";

    $scope.choose = function (item) {
        $scope.book = item;
    }

    $scope.listen = function (book) {
        $location.path('/episodes/' + book.podcast.soundcloud);
    }

    $scope.read = function (book) {
        $location.path('/reviews/' + book.review.template);
    }

    EntryService.getEntries(function (results) {
        var entries = results.slice(0);

        $scope.featured = findFeaturedArticle(entries);
        $scope.data = entries.map(function (item) {
            item['selected'] = false;
            item['created_at_date'] = new Date(item['created_at']);
            return item;
        }).sort(function (a, b) {
            if (a.created_at_date < b.created_at_date) return -1;
            if (a.created_at_date > b.created_at_date) return 1;
            return 0;
        }).reverse().slice(0, 5);
        $scope.book = $scope.data[0];
    });

    function findFeaturedArticle(entries) {
        return entries.filter(function (entry) {
            return entry.review.title === $scope.featuredTitle;
        })[0];
    }

}]);

app.controller('episodesCtrl', ['$scope', '$sce', '$http', 'EntryService', function ($scope, $sce, $http, EntryService) {

    window.scrollTo(0, 0);

    $scope.embed = '';
    $scope.episodes = [];

    EntryService.getEntries(function (entries) {
        $scope.episodes = entries;
        $http.get('./data/asides.json').then(function (asides) {
            asides = asides.data.map(function (item) {
                item['cover_image'] = 'bookcover1.png';
                item['created_at_date'] = new Date(item.created_at);
                item['term'] = 'Aside';
                item['play_on_page'] = true;
                item['podcast'] = {
                    title: item['title'],
                    episode: item['episode'],
                    hosts: item['hosts']
                }

                return item;
            });
            entries = entries.map(function (item) {
                item['created_at_date'] = new Date(item.created_at);
                item['term'] = 'Episode';
                item['play_on_page'] = false;
                return item;
            });
            var combo = entries.concat(asides);
            $scope.episodes = combo.sort(function (a, b) {
                if (a.created_at_date < b.created_at_date) return -1;
                if (a.created_at_date > b.created_at_date) return 1;
                return 0;
            });

        });
    });

    $scope.close = function () {
        $scope.embed = '';
    }

    $scope.play = function (id) {
        $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + id + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
        window.scrollTo(0, 0);
    }

}]);

app.controller('singleEpisodeCtrl', ['$scope', '$sce', '$routeParams', 'EntryService', function ($scope, $sce, $routeParams, EntryService) {

    window.scrollTo(0, 0);

    $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + $routeParams.episode + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
    $scope.episode = {};
    $scope.further_reading = '';

    EntryService.getEntry($routeParams.episode).then(function (entry) {
        var links = '';
        entry.podcast.further_reading.forEach(function (item) { links += item });
        $scope.episode = entry;
        $scope.further_reading = $sce.trustAsHtml(links);
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
