'use strict';

var imagesApp = angular.module('ImageZonesApp', [], function () {

}).constant('SETTINGS', {});

imagesApp.controller('Controller', ['$scope', '$log', function ($scope, $log) {
    $log.info('controller was initialized');
}]);

imagesApp.directive('layerImage', ['$log', function ($log) {

    function link(scope, element, attrs) {
        $log.info('directive');
    }

    return {
        restrict: 'AEC',
        link: link
    }
}]);