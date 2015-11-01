

var app = angular.module('miniMe', [
  'ngRoute', 'ngMap', 'ngAnimate'
]);

/**
* Configure the Routes
*/
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    // Home
    .when("/", { templateUrl: "partials/home.html", controller: "PageCtrl" })

    // Pages
    .when("/projects", { templateUrl: "partials/projects.html", controller: "PageCtrl" })

    .when("/experiences", { templateUrl: "partials/experiences.html", controller: "PageCtrl" })
    .when("/blog", { templateUrl: "partials/blog.html", controller: "PageCtrl" })
    .when("/contact", { templateUrl: "partials/contact.html", controller: "PageCtrl" })

    // else 404
    .otherwise("/404", { templateUrl: "partials/404.html", controller: "PageCtrl" });
} ]);


app.controller('PageCtrl', function ( $scope/*, $location, $http */) {
    console.log("Page Controller reporting for duty.");
    $scope.pageClass = 'page-effect';

});

app.controller("dataImagesWork", function ($scope) {
    $scope.images_work = [
        {   num: 1,
            category: 'web',
            src: "review_monitor/images/preview.jpg",
            description: 'Review Monitor is a Web App for monitoring product reviews from Amazon.',
            url_details: "review_monitor/details.html"
        },
        {   num: 2,
            category: 'web',
            src: "opinion_summarizer/images/preview.jpg",
            description: 'Opinion Summarizer is a Web App which determines the sentiment ratio of different aspects from product reviews.',
            url_details: "opinion_summarizer/details.html"
        },
        {   num: 3,
            category: 'mobile',
            src: "vr_muffin/images/preview.jpg",
            description: 'VR Muffin is a FPS Google Cardboard VR game using Myo and Leap as controller.',
            url_details: "vr_muffin/details.html"
        },
        {   num: 4,
            category: 'other',
            src: "multilingual_subsum/images/preview.jpg",
            description: 'Multilingual SubSum is a summarizer which supports Chinese, English and Spanish.',
            url_details: "multilingual_subsum/details.html"
        },
        {   num: 5,
            category: 'mobile',
            src: "drunkeneye/images/preview.jpg",
            description: 'Drunken Eye is an Android App which determines whether you are drunk or not by detecting Horizontal Gaze Nystagmus.',
            url_details: "drunkeneye/details.html"
        }
    ];

});


//'use strict';
app.directive('autoActive', ['$location', function ($location) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element) {
            function setActive() {
                var path = $location.path();
                if (path) {
                    angular.forEach(element.find('li'), function (li) {
                        var anchor = li.querySelector('a');
                        if (anchor.href.match('#' + path + '(?=\\?|$)')) {
                            angular.element(li).addClass('current');
                        } else {
                            angular.element(li).removeClass('current');
                        }
                    });
                }
            }

            setActive();

            scope.$on('$locationChangeSuccess', setActive);
        }
    }
} ]);






