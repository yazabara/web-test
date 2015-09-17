'use strict';

var imagesApp = angular.module('ImageZonesApp', [], function () {

}).constant('SETTINGS', {});

imagesApp.controller('Controller', ['$scope', '$log', function ($scope, $log) {
    $log.info('controller was initialized');
}]);

imagesApp.directive('layerImage', ['$log', function ($log) {

    var imageProps = {
        url: '',
        naturalHeight: 0,
        naturalWidth: 0
    };

    function link(scope, element, attrs) {
        //fill image props
        element.find('img').bind('load', function () {
                angular.extend(imageProps, {
                    naturalWidth: this.naturalWidth,
                    naturalHeight: this.naturalHeight,
                    url: scope.imgSrc
                });
                $log.info('image was loaded: ' + imageProps);
            }
        );
    }

    return {
        scope: {
            imgSrc: '@'
        },
        templateUrl: "layer-image-template.html",
        restrict: 'AEC',
        link: link
    }
}])
;