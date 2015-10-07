'use strict';

var imagesApp = angular.module('LayersImageApp', ['ui.bootstrap-slider'], function () {

}).constant('GLOBAL', {
    //settings from CONFIGURATION:
    uiSettings: {
        devices: {
            portrait: {
                aspectRatio: {
                    low: 0.563,
                    high: 0.563
                },
                screenSize: {
                    width: {
                        min: 320,
                        max: 414
                    },
                    height: {
                        min: 568,
                        max: 736
                    }
                }
            },
            landscape: {
                aspectRatio: {
                    low: 1.7777,
                    high: 1.7777
                },
                screenSize: {
                    width: {
                        min: 640,
                        max: 640
                    },
                    height: {
                        min: 640,
                        max: 640
                    }
                }
            }
        },
        UI: {
            overlays: {
                portrait: {
                    left: 70,
                    top: 85,
                    right: 0,
                    bottom: 100
                },
                landscape: {
                    left: 0,
                    top: 20,
                    right: 0,
                    bottom: 20
                }
            }
        }
    }
});

imagesApp.controller('Controller', ['$scope', '$log', 'GLOBAL', function ($scope, $log, GLOBAL) {
    $log.info('controller was initialized');

    $scope.resultCallback = function (result) {
        $log.info(result.zoomFactor + ' center : ' + result.center.x + ', ' + result.center.y);
    };

    $scope.ui = GLOBAL.uiSettings.UI.overlays;

    $scope.face = {
        "faceCenterX": 80,
        "faceCenterY": 41,
        "faceWidth": 9,
        "faceHeight": 16
    };
}]);


imagesApp.directive('layerImage', ['$log', 'GLOBAL', function ($log, GLOBAL) {

    function link(scope, element, attrs) {
        var Devices = GLOBAL.uiSettings.devices;
        var uiOverlays = JSON.parse(scope.ui);

        scope.settings = {
            controlHeight: 43,
            phone: {
                left: 15,
                top: 20,
                right: 15,
                bottom: 50
            }
        };

        // movement props
        scope.moveProps = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0
        };

        // calculated values
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
            MAXDH: Math.max(Devices.portrait.screenSize.height.max, Devices.landscape.screenSize.height.max),
            // MaxDeviceWidth (MAXDH)
            MAXDW: Math.max(Devices.portrait.screenSize.width.max, Devices.landscape.screenSize.width.max),
            // AV20150928 - no longer needed
            // Max device aspect ratio
            // MAXDAR : 0,
            //
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
            UIPROL: uiOverlays.portrait.left / Devices.portrait.screenSize.width.min,
            UIPROT: uiOverlays.portrait.top / Devices.portrait.screenSize.height.min,
            UIPROR: uiOverlays.portrait.right / Devices.portrait.screenSize.width.min,
            UIPROB: uiOverlays.portrait.bottom / Devices.portrait.screenSize.height.min,
            // UI Landscape Relative Offsets
            UILROL: uiOverlays.landscape.left / Devices.landscape.screenSize.width.min,
            UILROT: uiOverlays.landscape.top / Devices.landscape.screenSize.height.min,
            UILROR: uiOverlays.landscape.right / Devices.landscape.screenSize.width.min,
            UILROB: uiOverlays.landscape.bottom / Devices.landscape.screenSize.height.min,
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
            redZoneWidth: 0,// width of one border for red zone
            redZoneHeight: 0,// height of single border for red zone
            // borders for gray zone
            leftGrayBorder: 0,
            rightGrayBorder: 0,
            topGrayBorder: 0,
            bottomGrayBorder: 0,
            // center point (in range 0-1)
            centerGrayX: 0,
            centerGrayY: 0
        };

        // selectors
        scope.layers = {
            directiveElement: element,
            glassLayer: element.find('div.glass'),
            phoneLayer: element.find('div.phone-layer'),
            redLayer: element.find('div.red'),
            imageLayer: element.find('img.cropped-image'),
            grayLayer: element.find('div.gray')
        };

        scope.imageProps = {
            IDW: 0,// ImageDivWidth (IDW) - depends on zoom factor
            IDH: 0,// ImageDivHeight (IDH) - depends on zoom factor
            originalHeight: 0,// Image Height (IH)
            originalWidth: 0, // ImageWidth (IW)
            aspectRatio: 0
            // Image Aspect Ratio (IAR)
        };

        // view (our control-element)
        scope.previewProps = {
            zoomFactor: 1,
            height: 0,// //PreviewHeight PH = PW / IAR
            width: 0
            // PreviewWidth (PW)- the width of the image preview is (fixed in the HTML layout)
        };

        // on image load
        scope.layers.imageLayer.bind('load', function () {
            // fill image props
            angular.extend(scope.imageProps, {
                originalWidth: this.naturalWidth,
                originalHeight: this.naturalHeight,
                aspectRatio: this.naturalHeight == 0 ? 1 : this.naturalWidth / this.naturalHeight
            });
            // max device aspect ratio
            //
            // AV20150928 no need to calculate MAXDAR - and this calculation is incorrect - the correct value is configured in Devices.portrait.aspectRatio.high
            // scope.calculated.MAXDAR = scope.calculated.MAXDW / scope.calculated.MAXDH;
            //
            // fill preview props
            angular.extend(scope.previewProps, {
                width: attrs.width,
                // AV20150928
                // height : attrs.width / scope.calculated.MAXDAR//scope.imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
                height: attrs.width / Math.max(Devices.portrait.aspectRatio.high, Devices.landscape.aspectRatio.high) // AV20150928 scope.calculated.MAXDAR//scope.imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
            });
            // AV20150928 - PSCALE is now calculated depending on MINZF calculation method
            // scope.calculated.PSCALE = scope.previewProps.width / scope.calculated.MAXDW;
            // AV20150928 - moved ZF min/max calculation from checkZoomFactorAndApply - shall be done only once
            scope.calculated.MINZF = 1;
            var imageAspectRatio = scope.imageProps.originalWidth / scope.imageProps.originalHeight;
            var previewAspectRatio = scope.previewProps.width / scope.previewProps.height;
            if (imageAspectRatio >= previewAspectRatio) { // image wider than preview
                scope.calculated.PSCALE = scope.previewProps.height / scope.imageProps.originalHeight;
                scope.calculated.MAXZF = scope.imageProps.originalWidth * scope.calculated.PSCALE / scope.previewProps.width;
            }
            else { // image narrower than preview
                scope.calculated.PSCALE = scope.previewProps.width / scope.imageProps.originalWidth;
                scope.calculated.MAXZF = scope.imageProps.originalHeight * scope.calculated.PSCALE / scope.previewProps.height;
            }
            scope.calculated.MAXZF *= 1.5; // the number 1.5 represents the maximum pixelation that we allow.  In other words, we are allowing one pixel of the image to be stretched across up to 1.5 pixels on the screen.
            if (Math.abs(scope.calculated.MAXZF - scope.calculated.MINZF) <= 0.05) { // in case of low-resolution image
                scope.calculated.zoomStep = 0;
                scope.calculated.MAXZF = scope.calculated.MINZF;
            }
            else {
                var zoomStepsCount = Math.round(scope.previewProps.width / 5); // one step per 5px on the screen
                scope.calculated.zoomStep = Math.floor(10000 * ( scope.calculated.MAXZF - scope.calculated.MINZF ) / zoomStepsCount) / 10000;
                scope.calculated.MAXZF = Math.round(10000 * ( scope.calculated.MINZF + scope.calculated.zoomStep * zoomStepsCount )) / 10000;
            }
            //
            // set preview size (with controls)
            setElementSize(element, scope.previewProps.width, scope.previewProps.height + scope.settings.controlHeight);
            // set glass size
            setElementSize(scope.layers.glassLayer, scope.previewProps.width, scope.previewProps.height);

            if (attrs.centerX && attrs.centerY && attrs.zoomFactor && ( attrs.centerX != '0' && attrs.centerY != '0' && attrs.zoomFactor != '0' )) {
                initExistDirective(scope, attrs.zoomFactor, attrs.centerX, attrs.centerY);
            }
            else if (attrs.face) {
                scope.face = JSON.parse(attrs.face);
                initFaceDetectionDirective(scope, attrs.facePaddingX, attrs.facePaddingY);
            }
            else {
                initDefaultDirective(scope);
            }
            initImageMove(scope);
            // zoom factor changes listener
            scope.$watch('calculated.zoomFactor', function (newValue, oldValue) {
                // AV20150928 - fix value instead of skipping
                // if( !(newValue <= scope.calculated.MAXZF && newValue >= scope.calculated.MINZF) ) {
                // return;
                // }
                if (newValue < scope.calculated.MINZF) {
                    newValue = scope.calculated.MINZF;
                }
                if (newValue > scope.calculated.MAXZF) {
                    newValue = scope.calculated.MAXZF;
                }
                //
                scope.calculated.zoomFactor = newValue;
                zoomImage(scope);
                fillResult(scope);
            }, true);
            fillResult(scope);
        });
    }

    function initExistDirective(scope, zoomFactor, centerX, centerY) {
        checkZoomFactorAndApply(scope, parseFloat(zoomFactor));
        initImageZoom(scope);
        calculateLayers(scope);
        calculateExistCenterPointCoordinates(scope, parseFloat(centerX), parseFloat(centerY));
        initRedZone(scope);
        initGrayZone(scope);
        zoomImage(scope);
        initPhoneLayer(scope);
    }

    function initDefaultDirective(scope) {
        // recalculate zoomFactor
        initZoomFactor(scope);
        initImageZoom(scope);
        // calculate layers borders
        calculateLayers(scope);
        initRedZone(scope);
        initGrayZone(scope);
        initPhoneLayer(scope);
    }

    function initFaceDetectionDirective(scope, fPaddingX, fPaddingY) {
        calculateLayers(scope);
        var facePaddingX = fPaddingX ? parseFloat(fPaddingX) : 0.1;
        var facePaddingY = fPaddingY ? parseFloat(fPaddingY) : 0.1;
        // width and height in range [0,1]
        var AdjustedFaceWidth = Math.max(Math.min(( scope.face.faceWidth ) * ( 1 + ( 2 * facePaddingX ) ), 1), 0);
        var AdjustedFaceHeight = Math.max(Math.min(( scope.face.faceHeight ) * ( 1 + ( 2 * facePaddingY ) ), 1), 0);
        var clearPlace = Math.min(scope.calculated.cleanZoneWidth * scope.imageProps.originalWidth / scope.previewProps.width, scope.calculated.cleanZoneHeight * scope.imageProps.originalHeight / scope.previewProps.height);
        var facePlace = Math.min(AdjustedFaceWidth * scope.imageProps.originalWidth, AdjustedFaceHeight * scope.imageProps.originalHeight);
        // zoom
        var zoom = clearPlace / facePlace;
        // $log.info( 'ratio: ' + ratio + ', clearPlace: ' + clearPlace + ' facePlace : ' + facePlace + ' zoom ' + zoom );
        checkZoomFactorAndApply(scope, zoom);
        initImageZoom(scope);
        calculateExistCenterPointCoordinates(scope, parseFloat(scope.face.faceCenterX), parseFloat(scope.face.faceCenterY));
        initRedZone(scope);
        initGrayZone(scope);
        zoomImage(scope);
        initPhoneLayer(scope);
    }

    function calculateExistCenterPointCoordinates(scope, partX, partY) {
        if (partX < 0 || partX > 1 || partY < 0 || partY > 1) {
            return;// parts must be in range [0,1]
        }
        calculateGrayCenter(scope);
        var diffX = scope.imageProps.IDW * ( scope.calculated.centerGrayX - partX );
        var diffY = scope.imageProps.IDH * ( scope.calculated.centerGrayY - partY );
        scope.moveProps.x = diffX;
        scope.moveProps.y = diffY;
    }

    function zoomImage(scope) {
        var newWidth = scope.imageProps.originalWidth * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        var newHeight = scope.imageProps.originalHeight * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        var widthDiff = scope.imageProps.IDW - newWidth;
        var heightDiff = scope.imageProps.IDH - newHeight;

        var x = scope.moveProps.x + ( widthDiff / 2 );
        var y = scope.moveProps.y + ( heightDiff / 2 );

        // check borders
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
        // move image
        moveImage(scope, x, y);
        initImageZoom(scope);
    }

    function checkZoomFactorAndApply(scope, zoomFactor) {
        // AV20150928 - moved to execute earlier
        // scope.calculated.MINZF = Math.max( scope.calculated.MAXDW / scope.imageProps.originalWidth, scope.calculated.MAXDH / scope.imageProps.originalHeight );
        // scope.calculated.MAXZF = ( scope.calculated.MINZF >= 1 ? scope.calculated.MINZF : Math.min( scope.imageProps.originalWidth / scope.calculated.MAXDW, scope.imageProps.originalHeight / scope.calculated.MAXDW ) );
        //
        scope.calculated.zoomFactor = ( zoomFactor >= scope.calculated.MINZF && zoomFactor <= scope.calculated.MAXZF ) ? zoomFactor : ( zoomFactor < scope.calculated.MINZF ? scope.calculated.MINZF : scope.calculated.MAXZF ); // AV20150928 safety net (minor, potentially unnecessary improvement)
        scope.$apply();// apply zoom factor
    }

    function fillResult(scope) {
        var result = {
            zoomFactor: scope.calculated.zoomFactor,
            center: calculateGrayCenter(scope)
        };
        scope.callBackMethod({
            imageLayerResult: result
        });
    }

    /**
     * Method calculate result center for grayZone in range 0-1
     */
    function calculateGrayCenter(scope) {
        var leftPoint = scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder;
        var topPoint = scope.calculated.redZoneHeight + scope.calculated.topGrayBorder;
        var centerX = ( leftPoint + scope.calculated.cleanZoneWidth / 2 );
        var centerY = ( topPoint + scope.calculated.cleanZoneHeight / 2 );

        scope.calculated.centerGrayX = ( ( centerX - scope.moveProps.x ) / scope.imageProps.IDW );
        scope.calculated.centerGrayY = ( ( centerY - scope.moveProps.y ) / scope.imageProps.IDH );

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
     *
     * @param scope
     */
    function initZoomFactor(scope) {
        // AV20150928 - this seems more appropriate, although I don't see this code ever getting called
        // checkZoomFactorAndApply( scope, scope.previewProps.width / scope.imageProps.originalWidth );
        checkZoomFactorAndApply(scope, scope.calculated.MINZF);
    }

    /**
     * Method zooming image depends on zoomFactor (precalculated) without x,y delta
     *
     * @param scope
     */
    function initImageZoom(scope) {
        // ImageDivWidth (IDW)
        scope.imageProps.IDW = scope.imageProps.originalWidth * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        // ImageDivHeight (IDH)
        scope.imageProps.IDH = scope.imageProps.originalHeight * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        // $log.info('IDW = ' + scope.imageProps.IDW + ' , IDH = ' + scope.imageProps.IDH);
        scope.layers.imageLayer.css('width', scope.imageProps.IDW);
        scope.layers.imageLayer.css('height', scope.imageProps.IDH);
    }

    function initRedZone(scope) {
        // size
        setElementSize(scope.layers.redLayer, scope.previewProps.width, scope.previewProps.height);
        // borders
        setElementBorders(scope.layers.redLayer, scope.calculated.redZoneWidth, scope.calculated.redZoneWidth, scope.calculated.redZoneHeight, scope.calculated.redZoneHeight, 'rgba(255, 0, 0, 0.50)');
    }

    function initGrayZone(scope) {
        var delta = 0;
        // size
        setElementSize(scope.layers.grayLayer, scope.calculated.PCRW + delta, scope.calculated.LCRH + delta);
        // delta
        scope.layers.grayLayer.css('left', scope.calculated.redZoneWidth - delta / 2);
        scope.layers.grayLayer.css('top', scope.calculated.redZoneHeight - delta / 2);
        // borders
        setElementBorders(scope.layers.grayLayer, scope.calculated.leftGrayBorder, scope.calculated.rightGrayBorder, scope.calculated.topGrayBorder, scope.calculated.bottomGrayBorder, 'rgba(255, 255, 0, 0.25)');
    }

    /**
     * Make phone box layer - connected with gray zone dimensions
     * @param scope
     */
    function initPhoneLayer(scope) {
        var redZoneW = (scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var redZoneH = (scope.previewProps.height - 2 * scope.calculated.redZoneHeight);

        var phoneWidth = redZoneW + scope.settings.phone.left + scope.settings.phone.right;
        var phoneHeight = redZoneH + scope.settings.phone.top + scope.settings.phone.bottom;

        setElementSize(scope.layers.phoneLayer, phoneWidth, phoneHeight);
        //circle
        var circleDimension = scope.settings.phone.top / 2;
        setElementSize(scope.layers.phoneLayer.find('.phone-circle'), circleDimension , circleDimension);
        scope.layers.phoneLayer.find('.phone-circle').css('margin-top', scope.settings.phone.top / 4);
        //line
        var lineW = redZoneW / 3;
        setElementSize(scope.layers.phoneLayer.find('.phone-line'), lineW , scope.settings.phone.top / 7);
        scope.layers.phoneLayer.find('.phone-line').css('margin-top', scope.settings.phone.top / 2.2);

        scope.layers.phoneLayer.css('left', scope.calculated.redZoneWidth - scope.settings.phone.left);
        scope.layers.phoneLayer.css('top', scope.calculated.redZoneHeight - scope.settings.phone.top);
        scope.layers.phoneLayer.css('border-radius', Math.min((scope.settings.phone.top + scope.settings.phone.bottom) / 2 , (scope.settings.phone.left + scope.settings.phone.right) / 2));
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
            // /TODO init with params
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
        var Devices = GLOBAL.uiSettings.devices;
        // WorstCaseProtraitAspectRatio (WCPAR)
        scope.calculated.WCPAR = Math.min(Devices.portrait.aspectRatio.low, Devices.portrait.aspectRatio.high);
        // WorstCaseLandscapeAspectRatio (WCLAR)
        scope.calculated.WCLAR = Math.max(Devices.landscape.aspectRatio.low, Devices.landscape.aspectRatio.high);
        // PortraitCropRectangleWidth (PCRW)
        // AV20150928 scope.calculated.PCRW = scope.previewProps.width * scope.calculated.WCPAR;
        scope.calculated.PCRW = scope.previewProps.height * scope.calculated.WCPAR;
        // LandscapeCropRectangleHeight (LCRH)
        // AV20150928 scope.calculated.LCRH = scope.previewProps.height / scope.calculated.WCLAR;
        scope.calculated.LCRH = scope.previewProps.width / scope.calculated.WCLAR;
        // ShortestPortraitCropRectangleHeight (SPCRH)
        scope.calculated.SPCRH = scope.calculated.PCRW / Devices.portrait.aspectRatio.high;
        // NarrowestLandscapeCropRectangleWidth (NLCRW)
        scope.calculated.NLCRW = scope.previewProps.width * Devices.landscape.aspectRatio.low;
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

        // $log.info('PCRW: ' + scope.calculated.PCRW + ', LCRH: ' + scope.calculated.LCRH);

        // Clear Zone Size
        scope.calculated.cleanZoneWidth = Math.min(( scope.calculated.NLCRW - scope.calculated.UILAOL - scope.calculated.UILAOR ), ( scope.calculated.PCRW - scope.calculated.UIPAOL - scope.calculated.UIPAOR ));
        scope.calculated.cleanZoneHeight = Math.min(( scope.calculated.SPCRH - scope.calculated.UIPAOT - scope.calculated.UIPAOB ), ( scope.calculated.LCRH - scope.calculated.UILAOT - scope.calculated.UILAOB ));

        // Gray Zone Borders
        // top
        var tmpTP = ( scope.calculated.SPCRH / 2 - scope.calculated.UIPAOT );
        var tmpTL = ( scope.calculated.LCRH / 2 - scope.calculated.UILAOT );
        var minTmpTLP = Math.min(tmpTL, tmpTP, scope.calculated.LCRH / 2);
        scope.calculated.topGrayBorder = scope.calculated.LCRH / 2 - minTmpTLP;

        // bottom
        var tmpBP = ( scope.calculated.SPCRH / 2 - scope.calculated.UIPAOB );
        var tmpBL = ( scope.calculated.LCRH / 2 - scope.calculated.UILAOB );
        var minTmpBLP = Math.min(tmpBL, tmpBP, scope.calculated.LCRH / 2);
        scope.calculated.bottomGrayBorder = scope.calculated.LCRH / 2 - minTmpBLP;

        // left
        var tmpLP = ( scope.calculated.NLCRW / 2 - scope.calculated.UILAOL );
        var tmpLL = ( scope.calculated.PCRW / 2 - scope.calculated.UIPAOL );
        var minTmpLLP = Math.min(tmpLL, tmpLP, scope.calculated.PCRW / 2);
        scope.calculated.leftGrayBorder = scope.calculated.PCRW / 2 - minTmpLLP;

        // right
        var tmpRP = ( scope.calculated.NLCRW / 2 - scope.calculated.UILAOR );
        var tmpRL = ( scope.calculated.PCRW / 2 - scope.calculated.UIPAOR );
        var minTmpRLP = Math.min(tmpRL, tmpRP, scope.calculated.PCRW / 2);
        scope.calculated.rightGrayBorder = scope.calculated.PCRW / 2 - minTmpRLP;

        // $log.info('Clear zone: ' + scope.calculated.cleanZoneWidth + ', ' + scope.calculated.cleanZoneHeight);
        // Red Zone Size
        scope.calculated.redZoneWidth = ( scope.previewProps.width - scope.calculated.PCRW ) / 2;
        scope.calculated.redZoneHeight = ( scope.previewProps.height - scope.calculated.LCRH ) / 2;
        // $log.info('redZoneWidth = ' + scope.calculated.redZoneWidth + ' , redZoneHeight = ' + scope.calculated.redZoneHeight);
    }

    return {
        scope: {
            imgSrc: '@',
            ui: '@',
            callBackMethod: '&resultFunc'
        },
        template: '<div class="phone-layer">' +
        '<div class="phone-circle phone-top-additional"/>' +
        '<div class="phone-line phone-top-additional"/>' +
        '</div>' +
        '<div class="glass-wrapper">' +
        '<div class="glass">' +
        '<div class="red black-border"></div>' +
        '<div class="gray white-border"></div>' +
        '<img class="cropped-image" ng-src="{{imgSrc}}"/>' +
        '</div>' +
        '</div>' +
        '<div class="control-wrapper" >' +
        '<slider ng-class="{ \'hidden\' : calculated.MAXZF == calculated.MINZF}"' + 'ng-model="calculated.zoomFactor"' + 'min="calculated.MINZF"' + 'step="calculated.zoomStep"' + 'precision="4"' + 'max="calculated.MAXZF"' + 'value="calculated.zoomFactor">' +
        '</slider>' +
        '<span ng-class="{ \'hidden\' : calculated.MAXZF != calculated.MINZF}" class="control-message">' + 'Zooming not available: low-res image' +
        '</span>' +
        '</div>',
        restrict: 'E',
        link: link
    }
}]);