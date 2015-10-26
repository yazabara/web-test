'use strict';

var app = angular.module('LayersImageApp', ['ui.bootstrap-slider', 'yazabara.layers'], function () {});

app.controller('Controller', ['$scope', '$log', 'GLOBAL', function ($scope, $log, GLOBAL) {
    $log.info('controller was initialized');

    $scope.resultCallback = function (result) {
        $log.info(result.zoomFactor + ' image : ' + result.imageCenter.x + ', ' + result.imageCenter.y + ' phone: ' + result.phoneCenter.x + ', ' + result.phoneCenter.y + " shift: " + result.clearCenterShifts.shiftX + ', ' + result.clearCenterShifts.shiftY);
    };

    $scope.ui = GLOBAL.uiSettings.UI.overlays;

    $scope.face = {
        "faceCenterX": 0.44,
        "faceCenterY": 0.19,
        "faceWidth": 0.1,
        "faceHeight": 0.1
    };

    $scope.imgExist = {
        phoneCenter: {
            x: 0.5041111,
            y: 0.5354111
        },
        clearShift: {
            shiftX: 0.06,
            shiftY: -0.2
        },
        imageCenter: {
            centerX: 0.5,
            centerY: 0.5
        },
        zoomFactor: 1.5
    }
}]);
