var app = angular.module('myApp', ['ngRoute', 'ngAnimate', 'djds4rce.angular-socialshare']);

app.config(function ($routeProvider, $locationProvider) {
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
            templateUrl: "review.html"
        });

    $locationProvider.html5Mode(true).hashPrefix('!');
});

app.run(function ($FB) {
    $FB.init('1785189578409909');
});

app.controller('homeCtrl', ['$scope', '$location', '$timeout', 'EntryService', function ($scope, $location, $timeout, EntryService) {

    window.scrollTo(0, 0);

    $scope.book = {};
    $scope.data = [];
    $scope.featured = {};
    $scope.featuredTitle = "Looking Beyond The Beautiful: Running the Gamut of Thought in Thomas Mann's \"Death in Venice\"";
    // $scope.featuredTitle = "A Primer to Borges";

    $scope.choose = function (item) {
        if ($scope.book.created_at === item.created_at) {
            $scope.listen(item);
        } else {
            $scope.book = item;
        }
    }

    $scope.listen = function (book) {
        $location.path('/episodes/' + book.podcast.soundcloud);
    }

    $scope.read = function (book) {
        $location.path('/reviews/' + book.review.template.split('.')[0]);
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
        }).reverse().slice(0, 6);
        $scope.book = $scope.data[0];
    });

    function findFeaturedArticle(entries) {
        return entries.filter(function (entry) {
            return entry.review.title === $scope.featuredTitle;
        })[0];
    }

}]);

app.controller('episodesCtrl', ['$scope', '$sce', '$http', '$location', 'EntryService', function ($scope, $sce, $http, $location, EntryService) {

    window.scrollTo(0, 0);

    $scope.autoplay = window.location.hostname !== 'localhost';
    $scope.embed = '';
    $scope.episodes = [];

    EntryService.getEntries(function (entries) {
        $scope.episodes = entries;
        $http.get('./data/asides.json').then(function (asides) {
            asides = asides.data.map(function (item) {
                item['cover_image'] = 'havana_notebook.png';
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

    $scope.play = function (item) {
        if (item.play_on_page) {
            $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + item.soundcloud + '&amp;auto_play=' + $scope.autoplay + '&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
            window.scrollTo(0, 0);
        } else {
            $location.path('/episodes/' + item.podcast.soundcloud);
        }
    }

}]);

app.controller('singleEpisodeCtrl', ['$scope', '$sce', '$routeParams', 'EntryService', function ($scope, $sce, $routeParams, EntryService) {

    window.scrollTo(0, 0);

    $scope.autoplay = window.location.hostname !== 'localhost';
    $scope.embed = $sce.trustAsHtml('<iframe width="100%" height="150" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + $routeParams.episode + '&amp;auto_play=' + $scope.autoplay + '&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true;"></iframe>');
    $scope.episode = {};
    $scope.further_reading = '';
    $scope.url = 'thecasualacademic.com/' + window.location.pathname;

    EntryService.getEpisode($routeParams.episode).then(function (entry) {
        var links = '';
        entry.created_at_date = new Date(entry.created_at);
        entry.podcast.further_reading.forEach(function (item) { links += item });
        $scope.episode = entry;
        $scope.further_reading = $sce.trustAsHtml(links);
        $scope.$apply();
    })

}]);

app.controller('reviewsCtrl', ['$scope', '$location', 'EntryService', function ($scope, $location, EntryService) {

    window.scrollTo(0, 0);

    $scope.reviews = [];

    $scope.read = function (item) {
        $location.path('/reviews/' + item.review.template.replace('.html', ''));
    }

    $scope.review = EntryService.getReviews(function (results) {
        $scope.reviews = results;
        console.log(results);
    });

}]);

app.controller('reviewCtrl', ['$scope', '$sce', '$routeParams', 'EntryService', function ($scope, $sce, $routeParams, EntryService) {

    window.scrollTo(0, 0);

    $scope.review = {};
    $scope.url = 'thecasualacademic.com/' + window.location.pathname;

    $scope.review = EntryService.getReview($routeParams.template + '.html').then(function (entry) {
        $scope.review = entry.review;
        $scope.template = '/reviews/' + entry.review.template;
        $scope.$apply();
    });

}]);

app.service('EntryService', ['$http', function ($http) {

    this.loaded = [];

    this.get = function (prefix, identifier, variable) {
        return new Promise(function (callback) {
            return this.getEntries(function (entries) {
                var result = entries.filter(function (entry) {
                    return entry[prefix][identifier] === variable;
                });
                callback(result[0]);
            })
        }.bind(this), function (error) {
            console.log(error);
        })
    }

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

    this.getEpisode = function (soundcloudId) {
        return this.get('podcast', 'soundcloud', soundcloudId);
    }

    this.getReview = function (template) {
        return this.get('review', 'template', template);
    }

    this.getReviews = function (successHandler) {
        this.getEntries(function (results) {
            var reviews = results.filter(function (item) {
                return item.review.template;
            });
            successHandler(reviews);
        })
    }

}]);

app.directive("scrollpercent", function ($window) {
    return function (scope, element, attrs) {
        angular.element($window).bind("scroll", function () {
            if (document.getElementById('review-header')) {
                var p = Math.round(100 * (scrollY / (document.getElementById('review-header').scrollHeight + document.getElementById('review-text').scrollHeight - screen.availHeight + 30)));
                if (p < 0) p = 0;
                if (p > 100) p = 100;
                document.getElementById('percentage').textContent = p + '%';
            }
        });
    };
});

var percent = 0;
