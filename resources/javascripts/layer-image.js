'use strict';

var imagesApp = angular.module('LayersImageApp', ['ui.bootstrap-slider'], function () {

}).constant('SETTINGS', {
    //settings from CONFIGURATION:
    Devices: {
        Portrait: {
            AspectRatio: {
                Low: 0.4,
                High: 0.8
            },
            ScreenSize: {
                Width: {
                    Min: 240,
                    Max: 637
                },
                Height: {
                    Min: 320,
                    Max: 974
                }
            }
        },
        Landscape: {
            AspectRatio: {
                Low: 1.2,
                High: 2.3
            },
            ScreenSize: {
                Width: {
                    Min: 320,
                    Max: 974
                },
                Height: {
                    Min: 240,
                    Max: 637
                }
            }
        }
    },
    UI: {
        Overlays: {
            Portrait: {
                Left: 50,
                Top: 85,
                Right: 0,
                Bottom: 100
            },
            Landscape: {
                Left: 0,
                Top: 0,
                Right: 0,
                Bottom: 0
            }
        }
    }
});

imagesApp.controller('Controller', ['$scope', '$log', function ($scope, $log) {
    $log.info('controller was initialized');

    $scope.resultCallback = function (result) {
        $log.info(result.zoomFactor + ' center : ' + result.center.x + ', ' + result.center.y);
    }
}]);

imagesApp.directive('layerImage', ['$log', 'SETTINGS', '$document', function ($log, SETTINGS, $document) {

    function link(scope, element, attrs) {
        var Devices = SETTINGS.Devices;
        var UI = SETTINGS.UI;

        scope.settings = {
            controlHeight: 43
        };

        scope.noZoom = false;

        //movement props
        scope.moveProps = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0
        };

        //calculated values
        scope.calculated = {
            // WorstCaseProtraitAspectRatio (WCPAR)
            WCPAR: 0,
            // WorstCaseLandscapeAspectRatio (WCLAR)
            WCLAR: 0,
            // PortraitCropRectangleWidth (PCRW)
            PCRW: 0,
            // LandscapeCropRectangleHeight (LCRH)
            LCRH: 0,
            // ShortestPortraitCropRectangleHeight (SPCRH)
            SPCRH: 0,
            // NarrowestLandscapeCropRectangleWidth (NLCRW)
            NLCRW: 0,
            // MaxDeviceHeight (MAXDH)
            MAXDH: Math.max(Devices.Portrait.ScreenSize.Height.Max, Devices.Landscape.ScreenSize.Height.Max),
            // MaxDeviceWidth (MAXDH)
            MAXDW: Math.max(Devices.Portrait.ScreenSize.Width.Max, Devices.Landscape.ScreenSize.Width.Max),
            // Max device aspect ratio
            MAXDAR: 0,
            // Current zoom factor
            zoomFactor: 0,
            // MinZoomFactor (MINZF)
            MINZF: 0,
            // MaxZoonFactor (MAXZF)
            MAXZF: 0,
            // zoom step (range minZf -> maxZf)
            zoomStep: 0.1,
            PSCALE: 0,
            // UI Portrait Relative Offsets
            UIPROL: UI.Overlays.Portrait.Left / Devices.Portrait.ScreenSize.Width.Min,
            UIPROT: UI.Overlays.Portrait.Top / Devices.Portrait.ScreenSize.Height.Min,
            UIPROR: UI.Overlays.Portrait.Right / Devices.Portrait.ScreenSize.Width.Min,
            UIPROB: UI.Overlays.Portrait.Bottom / Devices.Portrait.ScreenSize.Height.Min,
            // UI Landscape Relative Offsets
            UILROL: UI.Overlays.Landscape.Left / Devices.Landscape.ScreenSize.Width.Min,
            UILROT: UI.Overlays.Landscape.Top / Devices.Landscape.ScreenSize.Height.Min,
            UILROR: UI.Overlays.Landscape.Right / Devices.Landscape.ScreenSize.Width.Min,
            UILROB: UI.Overlays.Landscape.Bottom / Devices.Landscape.ScreenSize.Height.Min,
            // UI Portrait Overlay Actual Px Offsets
            UIPAOL: 0,
            UIPAOT: 0,
            UIPAOR: 0,
            UIPAOB: 0,
            // UI Lvar ndscape Overlay Actual Px Offsets
            UILAOL: 0,
            UILAOT: 0,
            UILAOR: 0,
            UILAOB: 0,
            // Clear Zone Size
            cleanZoneWidth: 0,
            cleanZoneHeight: 0,
            // Red Zone Size
            redZoneWidth: 0,//width of one border for red zone
            redZoneHeight: 0,//height of single border for red zone
            //borders for gray zone
            leftGrayBorder: 0,
            rightGrayBorder: 0,
            topGrayBorder: 0,
            bottomGrayBorder: 0,
            //center point (in range 0-1)
            centerGrayX: 0,
            centerGrayY: 0
        };

        //selectors
        scope.layers = {
            directiveElement: element,
            glassLayer: element.find('div.glass'),
            redLayer: element.find('div.red'),
            imageLayer: element.find('img.cropped-image'),
            grayLayer: element.find('div.gray')
        };

        scope.imageProps = {
            IDW: 0,// ImageDivWidth (IDW) - depends on zoom factor
            IDH: 0,//ImageDivHeight (IDH) - depends on zoom factor
            originalHeight: 0,// Image Height (IH)
            originalWidth: 0, // ImageWidth (IW)
            aspectRatio: 0// Image Aspect Ratio (IAR)
        };

        //view (our control-element)
        scope.previewProps = {
            zoomFactor: 1,
            height: 0,////PreviewHeight PH = PW / IAR
            width: 0 // PreviewWidth  (PW)- the width of the image preview is (fixed in the HTML layout)
        };

        //on image load
        scope.layers.imageLayer.bind('load', function () {
                //fill image props
                angular.extend(scope.imageProps, {
                    originalWidth: this.naturalWidth,
                    originalHeight: this.naturalHeight,
                    aspectRatio: this.naturalHeight == 0 ? 1 : this.naturalWidth / this.naturalHeight
                });
                // max device aspect ratio
                scope.calculated.MAXDAR = scope.calculated.MAXDW / scope.calculated.MAXDH;
                //fill preview props
                angular.extend(scope.previewProps, {
                    width: attrs.width,
                    height: attrs.width / scope.calculated.MAXDAR//scope.imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
                });
                scope.calculated.PSCALE = scope.previewProps.width / scope.calculated.MAXDW;

                //set preview size (with controls)
                setElementSize(element, scope.previewProps.width, scope.previewProps.height + scope.settings.controlHeight);
                //set glass size
                setElementSize(scope.layers.glassLayer, scope.previewProps.width, scope.previewProps.height);

                if (attrs.centerX && attrs.centerY && attrs.zoomFactor) {
                    checkZoomFactorAndApply(scope, parseFloat(attrs.zoomFactor));
                    initImageZoom(scope);
                    calculateLayers(scope);
                    calculateExistCenterPointCoordinates(scope, parseFloat(attrs.centerX), parseFloat(attrs.centerY));
                    initRedZone(scope);
                    initGrayZone(scope);
                    zoomImage(scope);
                } else {
                    //recalculate zoomFactor
                    initZoomFactor(scope);
                    initImageZoom(scope);
                    //calculate layers borders
                    calculateLayers(scope);
                    initRedZone(scope);
                    initGrayZone(scope);
                }

                initImageMove(scope);
                //zoom factor changes listener
                scope.$watch('calculated.zoomFactor', function (newValue, oldValue) {
                    if (!(newValue < scope.calculated.MAXZF && newValue >= scope.calculated.MINZF)) {
                        return;
                    }
                    scope.calculated.zoomFactor = newValue;
                    zoomImage(scope);
                    fillResult(scope);
                }, true);
                fillResult(scope);
            }
        );
    }

    function calculateExistCenterPointCoordinates(scope, partX, partY) {
        if (partX < 0 || partX > 1 || partY < 0 || partY > 1) {
            return;//parts must be in range [0,1]
        }
        calculateGrayCenter(scope);
        var diffX = scope.imageProps.IDW * ( scope.calculated.centerGrayX - partX);
        var diffY = scope.imageProps.IDH * ( scope.calculated.centerGrayY - partY);
        scope.moveProps.x = diffX;
        scope.moveProps.y = diffY;
    }

    function zoomImage(scope) {
        var newWidth = scope.imageProps.originalWidth * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        var newHeight = scope.imageProps.originalHeight * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        var widthDiff = scope.imageProps.IDW - newWidth;
        var heightDiff = scope.imageProps.IDH - newHeight;

        var x = scope.moveProps.x + (widthDiff / 2);
        var y = scope.moveProps.y + (heightDiff / 2);

        //check borders
        var endXImage = x + newWidth;
        var endYImage = y + newHeight;

        if (x > 0) {
            x = 0;
        }

        if (endXImage < scope.previewProps.width) {
            x = scope.previewProps.width - newWidth;
        }

        if (y > 0) {
            y = 0;
        }

        if (endYImage < scope.previewProps.height) {
            y = scope.previewProps.height - newHeight;
        }
        //move image
        moveImage(scope, x, y);
        initImageZoom(scope);
    }

    function checkZoomFactorAndApply(scope, zoomFactor) {
        scope.calculated.MINZF = Math.max(scope.calculated.MAXDW / scope.imageProps.originalWidth, scope.calculated.MAXDH / scope.imageProps.originalHeight);
        scope.calculated.MAXZF = ( scope.calculated.MINZF >= 1 ? scope.calculated.MINZF : Math.min(scope.imageProps.originalWidth / scope.calculated.MAXDW, scope.imageProps.originalHeight / scope.calculated.MAXDW) );
        scope.calculated.zoomFactor = (zoomFactor < scope.calculated.MAXZF && zoomFactor >= scope.calculated.MINZF) ? zoomFactor : scope.calculated.MINZF;
        scope.$apply();//apply zoom factor

    }

    function fillResult(scope) {
        var result = {
            zoomFactor: scope.calculated.zoomFactor,
            center: calculateGrayCenter(scope)
        };
        scope.callBackMethod({imageLayerResult: result});
    }

    /**
     * Method calculate result center for grayZone in range 0-1
     */
    function calculateGrayCenter(scope) {
        var leftPoint = scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder;
        var topPoint = scope.calculated.redZoneHeight + scope.calculated.topGrayBorder;
        var centerX = (leftPoint + scope.calculated.cleanZoneWidth / 2);
        var centerY = (topPoint + scope.calculated.cleanZoneHeight / 2);

        scope.calculated.centerGrayX = ((centerX - scope.moveProps.x) / scope.imageProps.IDW);
        scope.calculated.centerGrayY = ((centerY - scope.moveProps.y) / scope.imageProps.IDH);

        return {
            x: scope.calculated.centerGrayX,
            y: scope.calculated.centerGrayY
        }

    }

    function setElementSize(element, width, height) {
        element.css('width', width);
        element.css('height', height);
    }

    function setElementBorders(element, left, right, top, bottom, rgba) {
        element.css('border-left', left + "px solid " + rgba);
        element.css('border-right', right + "px solid " + rgba);
        element.css('border-top', top + "px solid " + rgba);
        element.css('border-bottom', bottom + "px solid " + rgba);
    }

    function moveImage(scope, newX, newY) {
        scope.moveProps.x = newX;
        scope.moveProps.y = newY;
        scope.layers.imageLayer.css({
            left: scope.moveProps.x + 'px',
            top: scope.moveProps.y + 'px'
        });
    }

    /**
     * Method calculate zoomFactor connected with settings and image original size
     * @param scope
     */
    function initZoomFactor(scope) {
        checkZoomFactorAndApply(scope, scope.previewProps.width / scope.imageProps.originalWidth);
    }

    /**
     * Method zooming image depends on zoomFactor (precalculated)
     * without x,y delta
     * @param scope
     */
    function initImageZoom(scope) {
        // ImageDivWidth (IDW)
        scope.imageProps.IDW = scope.imageProps.originalWidth * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        // ImageDivHeight (IDH)
        scope.imageProps.IDH = scope.imageProps.originalHeight * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        //$log.info('IDW = ' + scope.imageProps.IDW + ' , IDH = ' + scope.imageProps.IDH);
        scope.layers.imageLayer.css('width', scope.imageProps.IDW);
        scope.layers.imageLayer.css('height', scope.imageProps.IDH);
    }

    function initRedZone(scope) {
        //size
        setElementSize(scope.layers.redLayer, scope.previewProps.width, scope.previewProps.height);
        //borders
        setElementBorders(scope.layers.redLayer, scope.calculated.redZoneWidth, scope.calculated.redZoneWidth, scope.calculated.redZoneHeight, scope.calculated.redZoneHeight, 'rgba(0, 0, 0, 0.65)');
    }

    function initGrayZone(scope) {
        var delta = 0;
        //size
        setElementSize(scope.layers.grayLayer, scope.calculated.PCRW + delta, scope.calculated.LCRH + delta);
        //delta
        scope.layers.grayLayer.css('left', scope.calculated.redZoneWidth - delta / 2);
        scope.layers.grayLayer.css('top', scope.calculated.redZoneHeight - delta / 2);
        //borders
        setElementBorders(scope.layers.grayLayer, scope.calculated.leftGrayBorder, scope.calculated.rightGrayBorder, scope.calculated.topGrayBorder, scope.calculated.bottomGrayBorder, 'rgba(0, 0, 0, 0.5)');
    }

    function initImageMove(scope) {
        scope.layers.glassLayer.on('mousedown', function (event) {
            // Prevent default dragging of selected content
            event.preventDefault();
            scope.moveProps.startX = event.pageX - scope.moveProps.x;
            scope.moveProps.startY = event.pageY - scope.moveProps.y;
            scope.layers.glassLayer.on('mousemove', mousemove);
            scope.layers.glassLayer.on('mouseup', mouseup);
            scope.layers.glassLayer.on('mouseleave', mouseup);
            ///TODO init with params
            scope.layers.imageLayer.css({
                left: scope.moveProps.x + 'px',
                top: scope.moveProps.y + 'px'
            });
        });

        function mousemove(event) {
            var x = event.pageX - scope.moveProps.startX;
            var y = event.pageY - scope.moveProps.startY;
            var endXImage = x + scope.imageProps.IDW;
            var endYImage = y + scope.imageProps.IDH;

            if (x < 0 && endXImage > scope.previewProps.width) {
                scope.moveProps.x = x;
                scope.layers.imageLayer.css({
                    left: x + 'px'
                });
            }
            if (y < 0 && endYImage > scope.previewProps.height) {
                scope.moveProps.y = y;
                scope.layers.imageLayer.css({
                    top: y + 'px'
                });
            }
            fillResult(scope);
        }

        function mouseup() {
            scope.layers.glassLayer.off('mousemove', mousemove);
            scope.layers.glassLayer.off('mouseup', mouseup);
        }
    }

    function calculateLayers(scope) {
        var Devices = SETTINGS.Devices;
        // WorstCaseProtraitAspectRatio (WCPAR)
        scope.calculated.WCPAR = Math.min(Devices.Portrait.AspectRatio.Low, Devices.Portrait.AspectRatio.High);
        // WorstCaseLandscapeAspectRatio (WCLAR)
        scope.calculated.WCLAR = Math.max(Devices.Landscape.AspectRatio.Low, Devices.Landscape.AspectRatio.High);
        // PortraitCropRectangleWidth (PCRW)
        scope.calculated.PCRW = scope.previewProps.width * scope.calculated.WCPAR;
        // LandscapeCropRectangleHeight (LCRH)
        scope.calculated.LCRH = scope.previewProps.height / scope.calculated.WCLAR;
        // ShortestPortraitCropRectangleHeight (SPCRH)
        scope.calculated.SPCRH = scope.calculated.PCRW / Devices.Portrait.AspectRatio.High;
        // NarrowestLandscapeCropRectangleWidth (NLCRW)
        scope.calculated.NLCRW = scope.previewProps.width * Devices.Landscape.AspectRatio.Low;
        // UI Portrait Overlay Actual Px Offsets
        scope.calculated.UIPAOL = scope.calculated.UIPROL * scope.calculated.PCRW;
        scope.calculated.UIPAOT = scope.calculated.UIPROT * scope.calculated.SPCRH;
        scope.calculated.UIPAOR = scope.calculated.UIPROR * scope.calculated.PCRW;
        scope.calculated.UIPAOB = scope.calculated.UIPROB * scope.calculated.SPCRH;
        // UI Landscape Overlay Actual Px Offsets
        scope.calculated.UILAOL = scope.calculated.UILROL * scope.calculated.NLCRW;
        scope.calculated.UILAOT = scope.calculated.UILROT * scope.calculated.LCRH;
        scope.calculated.UILAOR = scope.calculated.UILROR * scope.calculated.NLCRW;
        scope.calculated.UILAOB = scope.calculated.UILROB * scope.calculated.LCRH;

        //$log.info('PCRW: ' + scope.calculated.PCRW + ', LCRH: ' + scope.calculated.LCRH);

        // Clear Zone Size
        scope.calculated.cleanZoneWidth = Math.min((scope.calculated.NLCRW - scope.calculated.UILAOL - scope.calculated.UILAOR), (scope.calculated.PCRW - scope.calculated.UIPAOL - scope.calculated.UIPAOR));
        scope.calculated.cleanZoneHeight = Math.min((scope.calculated.SPCRH - scope.calculated.UIPAOT - scope.calculated.UIPAOB), (scope.calculated.LCRH - scope.calculated.UILAOT - scope.calculated.UILAOB));

        //Gray Zone Borders
        //top
        var tmpTP = (scope.calculated.SPCRH / 2 - scope.calculated.UIPAOT);
        var tmpTL = (scope.calculated.LCRH / 2 - scope.calculated.UILAOT);
        var minTmpTLP = Math.min(tmpTL, tmpTP, scope.calculated.LCRH / 2);
        scope.calculated.topGrayBorder = scope.calculated.LCRH / 2 - minTmpTLP;

        //bottom
        var tmpBP = (scope.calculated.SPCRH / 2 - scope.calculated.UIPAOB);
        var tmpBL = (scope.calculated.LCRH / 2 - scope.calculated.UILAOB);
        var minTmpBLP = Math.min(tmpBL, tmpBP, scope.calculated.LCRH / 2);
        scope.calculated.bottomGrayBorder = scope.calculated.LCRH / 2 - minTmpBLP;

        //left
        var tmpLP = (scope.calculated.NLCRW / 2 - scope.calculated.UILAOL);
        var tmpLL = (scope.calculated.PCRW / 2 - scope.calculated.UIPAOL);
        var minTmpLLP = Math.min(tmpLL, tmpLP, scope.calculated.PCRW / 2);
        scope.calculated.leftGrayBorder = scope.calculated.PCRW / 2 - minTmpLLP;

        //right
        var tmpRP = (scope.calculated.NLCRW / 2 - scope.calculated.UILAOR);
        var tmpRL = (scope.calculated.PCRW / 2 - scope.calculated.UIPAOR);
        var minTmpRLP = Math.min(tmpRL, tmpRP, scope.calculated.PCRW / 2);
        scope.calculated.rightGrayBorder = scope.calculated.PCRW / 2 - minTmpRLP;

        //$log.info('Clear zone: ' + scope.calculated.cleanZoneWidth + ', ' + scope.calculated.cleanZoneHeight);
        // Red Zone Size
        scope.calculated.redZoneWidth = (scope.previewProps.width - scope.calculated.PCRW) / 2;
        scope.calculated.redZoneHeight = (scope.previewProps.height - scope.calculated.LCRH) / 2;
        //$log.info('redZoneWidth = ' + scope.calculated.redZoneWidth + ' , redZoneHeight = ' + scope.calculated.redZoneHeight);
    }

    return {
        scope: {
            imgSrc: '@',
            callBackMethod: '&resultFunc'
        },
        templateUrl: "pages/templates/layer-image-template.html",
        restrict: 'E',
        link: link
    }
}])
;