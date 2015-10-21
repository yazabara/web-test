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
                    high: 1.6777
                },
                screenSize: {
                    width: {
                        min: 640,
                        max: 640
                    },
                    height: {
                        min: 640,
                        max: 720
                    }
                }
            }
        },
        UI: {
            overlays: {
                portrait: {
                    left: 0,
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
        // $log.info(result.zoomFactor + ' center : ' + result.center.x + ', ' + result.center.y);
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

    //Calculation with zones
    var ZonesUtils = {};

    ZonesUtils.calculateZones = function (scope) {
        var Devices = GLOBAL.uiSettings.devices;
        // WorstCaseProtraitAspectRatio (WCPAR)
        scope.calculated.WCPAR = Math.min(Devices.portrait.aspectRatio.low, Devices.portrait.aspectRatio.high);
        // WorstCaseLandscapeAspectRatio (WCLAR)
        scope.calculated.WCLAR = Math.max(Devices.landscape.aspectRatio.low, Devices.landscape.aspectRatio.high);
        // PortraitCropRectangleWidth (PCRW)
        // AV20150928 scope.calculated.PCRW = scope.previewProps.width * scope.calculated.WCPAR;
        scope.calculated.PCRW = scope.previewProps.height * scope.calculated.WCPAR;
        // LandscapeCropRectangleHeight (LCRH)
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
        // Red Zone Size
        scope.calculated.redZoneWidth = ( scope.previewProps.width - scope.calculated.PCRW ) / 2;
        scope.calculated.redZoneHeight = ( scope.previewProps.height - scope.calculated.LCRH ) / 2;
    };

    //phone calculations
    var PhoneUtils = {};

    PhoneUtils.getPhonePosition = function (scope) {
        var displayPosition = PhoneUtils.getDisplayPosition(scope);
        return {
            left: displayPosition.left - scope.settings.phone.left,
            top: displayPosition.top - scope.settings.phone.top
        }
    };

    PhoneUtils.getDisplayPosition = function (scope) {
        return {
            left: scope.phone.display.center.x - (scope.phone.display.w / 2 ),
            top: scope.phone.display.center.y - (scope.phone.display.h / 2 )
        }
    };

    PhoneUtils.checkDisplayInPreview = function (scope) {
        var displayPosition = PhoneUtils.getDisplayPosition(scope);
        if (displayPosition.left < 0) { //
            scope.phone.display.center.x = scope.phone.display.w / 2;
        }
        if (displayPosition.top < 0) { //
            scope.phone.display.center.y = scope.phone.display.h / 2;
        }
        if (displayPosition.left + scope.phone.display.w > scope.previewProps.width) { //
            scope.phone.display.center.x = scope.previewProps.width - scope.phone.display.w / 2;
        }
        if (displayPosition.top + scope.phone.display.h > scope.previewProps.height) { //
            scope.phone.display.center.y = scope.previewProps.height - scope.phone.display.h / 2;
        }
    };

    /**
     * Method calculates phone center coordinates and set it
     * @param scope
     */
    PhoneUtils.initPhoneParams = function (scope) {
        //display dimensions
        scope.phone.display.w = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        scope.phone.display.h = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        //center by default - center preview
        scope.phone.display.center.x = scope.previewProps.width / 2;
        scope.phone.display.center.y = scope.previewProps.height / 2;
        //phone size
        scope.phone.w = parseInt(scope.phone.display.w + scope.settings.phone.left + scope.settings.phone.right);
        scope.phone.h = parseInt(scope.phone.display.h + scope.settings.phone.top + scope.settings.phone.bottom);
        PhoneUtils.checkDisplayInPreview(scope);
    };

    PhoneUtils.calculateDisplayCenter = function (scope) {
        scope.phone.display.center.x = scope.phoneMoveProps.x + scope.settings.phone.left + scope.phone.w / 2;
        scope.phone.display.center.y = scope.phoneMoveProps.y + scope.settings.phone.top + scope.phone.h / 2;
    };

    //zoom calculations
    var ZoomUtils = {};

    /**
     * Method calculates minZoom, MaxZoom and zoomStep
     * @param scope
     */
    ZoomUtils.initZoomParams = function (scope) {
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
    };

    /**
     * Method calculate zoomFactor connected with settings and image original size
     *
     * @param scope
     */
    ZoomUtils.initZoomFactor = function (scope) {
        ZoomUtils.checkZoomFactorAndApply(scope, scope.calculated.MINZF);
    };

    /**
     * Method check zoomFactor in range minZoom - maxZoom
     * @param scope
     * @param zoomFactor
     */
    ZoomUtils.checkZoomFactorAndApply = function (scope, zoomFactor) {
        scope.calculated.zoomFactor = ( zoomFactor >= scope.calculated.MINZF && zoomFactor <= scope.calculated.MAXZF ) ? zoomFactor : ( zoomFactor < scope.calculated.MINZF ? scope.calculated.MINZF : scope.calculated.MAXZF );
        scope.$apply();// apply zoom factor
    };

    var MovementUtils = {};

    MovementUtils.movePhone = function (scope) {
        var phonePosition = PhoneUtils.getPhonePosition(scope);
        //move phone
        scope.layers.phoneLayer.css('left', phonePosition.left);
        scope.layers.phoneLayer.css('top', phonePosition.top);
        //move gray zone
        var displayPosition = PhoneUtils.getDisplayPosition(scope);
        scope.layers.grayLayer.css('left', displayPosition.left);
        scope.layers.grayLayer.css('top', displayPosition.top);
    };

    var LayerUtils = {};

    LayerUtils.setElementSize = function (element, width, height) {
        element.css('width', width);
        element.css('height', height);
    };

    LayerUtils.setElementBorders = function (element, left, right, top, bottom, rgba) {
        element.css('border-left', left + "px solid " + rgba);
        element.css('border-right', right + "px solid " + rgba);
        element.css('border-top', top + "px solid " + rgba);
        element.css('border-bottom', bottom + "px solid " + rgba);
    };

    LayerUtils.setControlSize = function (controlElement, scope) {
        // set preview size (with controls)
        LayerUtils.setElementSize(controlElement, scope.previewProps.width, scope.previewProps.height + scope.settings.controlHeight);
        // set glass size
        LayerUtils.setElementSize(scope.layers.glassLayer, scope.previewProps.width, scope.previewProps.height);
    };

    /**
     * Make phone box layer - connected with gray zone dimensions
     * @param scope
     */
    LayerUtils.initPhoneLayer = function (scope) {
        //phone
        LayerUtils.setElementSize(scope.layers.phoneLayer, scope.phone.w, scope.phone.h);
        MovementUtils.movePhone(scope);
        scope.layers.phoneLayer.css('border-radius', (scope.settings.phone.top + scope.settings.phone.bottom + scope.settings.phone.left + scope.settings.phone.right) / 4);
        //camera
        var circleDimension = parseInt(scope.settings.phone.top / 3);
        LayerUtils.setElementSize(scope.layers.phoneLayer.find('.phone-camera'), circleDimension, circleDimension);
        scope.layers.phoneLayer.find('.phone-camera').css('top', -(scope.settings.phone.top / 2) - (circleDimension / 2));
        scope.layers.phoneLayer.find('.phone-camera').css('left', (scope.phone.w / 4) - scope.settings.phone.left);
        //dynamic
        var lineW = scope.phone.w / 4;
        var lineH = scope.settings.phone.top / 7;
        LayerUtils.setElementSize(scope.layers.phoneLayer.find('.phone-dynamic'), lineW, lineH);
        scope.layers.phoneLayer.find('.phone-dynamic').css('top', -(scope.settings.phone.top / 2) - (lineH / 2));
        scope.layers.phoneLayer.find('.phone-dynamic').css('left', (scope.phone.w / 2) - (lineW / 2) - scope.settings.phone.left);
        //background
        scope.layers.phoneLayer.css('border-top', 'black ' + scope.settings.phone.top + 'px solid');
        scope.layers.phoneLayer.css('border-bottom', 'black ' + scope.settings.phone.bottom + 'px solid');
        scope.layers.phoneLayer.css('border-right', 'black ' + (scope.settings.phone.right + 2) + 'px solid');
        scope.layers.phoneLayer.css('border-left', 'black ' + (scope.settings.phone.left + 2) + 'px solid');
        scope.layers.phoneLayer.css('padding-left', (scope.phone.w - (scope.settings.phone.left + scope.settings.phone.right)) + 'px');
        scope.layers.phoneLayer.css('padding-top', (scope.phone.h - (scope.settings.phone.top + scope.settings.phone.bottom)) + 'px');
        //display
        LayerUtils.setElementSize(scope.layers.phoneLayer.find('.phone-display'), scope.phone.display.w, scope.phone.display.h);
        //button
        var buttonDimension = parseInt(scope.settings.phone.bottom / 1.5);
        LayerUtils.setElementSize(scope.layers.phoneLayer.find('.phone-button'), buttonDimension, buttonDimension);
        scope.layers.phoneLayer.find('.phone-button').css('bottom', -(scope.settings.phone.bottom / 2) - (buttonDimension / 2));
        scope.layers.phoneLayer.find('.phone-button').css('left', ((scope.phone.w / 2) - (buttonDimension / 2) - scope.settings.phone.left));
        //sub-button
        var subButtonDimension = parseInt(buttonDimension / 2);
        LayerUtils.setElementSize(scope.layers.phoneLayer.find('.phone-sub-button'), subButtonDimension, subButtonDimension);
        scope.layers.phoneLayer.find('.phone-sub-button').css('bottom', parseInt(subButtonDimension) - (subButtonDimension / 2) - 1);
        scope.layers.phoneLayer.find('.phone-sub-button').css('left', parseInt(subButtonDimension - (subButtonDimension / 2)) - 1);
        initPhoneMove(scope);
    };


    /**
     * Method init gray zone: set size and borders.
     * @param scope
     */
    LayerUtils.initGrayLayer = function (scope) {
        // size
        LayerUtils.setElementSize(scope.layers.grayLayer, scope.phone.display.w, scope.phone.display.h);
        var displayPosition = PhoneUtils.getDisplayPosition(scope);
        scope.layers.grayLayer.css('left', displayPosition.left);
        scope.layers.grayLayer.css('top', displayPosition.top);
        // borders
        LayerUtils.setElementBorders(scope.layers.grayLayer, scope.calculated.leftGrayBorder, scope.calculated.rightGrayBorder, scope.calculated.topGrayBorder, scope.calculated.bottomGrayBorder, 'rgba(255, 255, 0, 0.25)');
    };

    function link(scope, element, attrs) {
        var Devices = GLOBAL.uiSettings.devices;
        var uiOverlays = JSON.parse(scope.ui);

        scope.settings = {
            controlHeight: 100,
            phone: {
                left: 10,
                top: 40,
                right: 10,
                bottom: 50
            }
        };

        scope.phone = {
            display: {//phone display
                w: 0,
                h: 0,
                center: {//display center coordinates
                    x: 0,
                    y: 0
                }
            },
            //phone dimensions (width and height)
            w: 0,
            h: 0
        };

        // movement props
        scope.moveProps = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0
        };

        // movement props
        scope.phoneMoveProps = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0
        };

        scope.formatZoomFactor = function (value) {
            return parseFloat(value.toFixed(3));
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
            // Current zoom factor
            zoomFactor: 0,
            // MinZoomFactor (MINZF)
            MINZF: 1,
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
            bottomGrayBorder: 0
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
                // fill preview props
                angular.extend(scope.previewProps, {
                    width: parseInt(attrs.width),
                    height: attrs.width / Math.max(Devices.portrait.aspectRatio.high, Devices.landscape.aspectRatio.high)
                });
                ZoomUtils.initZoomParams(scope);
                ZoomUtils.initZoomFactor(scope);
                ZonesUtils.calculateZones(scope);
                PhoneUtils.initPhoneParams(scope);
                LayerUtils.initGrayLayer(scope);
                LayerUtils.setControlSize(element, scope);
                //params exists
                //if (attrs.centerX && attrs.centerY && attrs.zoomFactor && ( attrs.centerX != '0' && attrs.centerY != '0' && attrs.zoomFactor != '0' )) {
                //    initExistDirective(scope, attrs.zoomFactor, attrs.centerX, attrs.centerY);
                //}
                //else if (attrs.face) {//face exist
                //    scope.face = JSON.parse(attrs.face);
                //    initFaceDetectionDirective(scope, attrs.facePaddingX, attrs.facePaddingY);
                //}
                //else {//default directive
                initDefaultDirective(scope);
                //}
                initImageMove(scope);
                // zoom factor changes listener
                scope.$watch('calculated.zoomFactor', function (newValue, oldValue) {
                    if (newValue < scope.calculated.MINZF) {
                        newValue = scope.calculated.MINZF;
                    }
                    if (newValue > scope.calculated.MAXZF) {
                        newValue = scope.calculated.MAXZF;
                    }
                    scope.calculated.zoomFactor = newValue;
                    var prevCenter = calculateGrayCenter(scope);
                    zoomImage(scope);
                    calculateExistCenterPointCoordinates(scope, parseFloat(prevCenter.x), parseFloat(prevCenter.y));
                    fillResult(scope);
                }, true);
                fillResult(scope);
            }
        );
    }

    function initExistDirective(scope, zoomFactor, centerX, centerY) {
        //zoom
        ZoomUtils.checkZoomFactorAndApply(scope, parseFloat(zoomFactor));
        initImageZoom(scope);
        //calculate basic params
        calculateZones(scope);
        setDefaultPhonePosition(scope);
        //get center
        calculateExistCenterPointCoordinates(scope, parseFloat(centerX), parseFloat(centerY));
        //fill gray zone
        LayerUtils.initGrayLayer(scope);
        //check and zoom
        zoomImage(scope);
        LayerUtils.initPhoneLayer(scope);
    }

    function initDefaultDirective(scope) {
        zoomImage(scope);
        LayerUtils.initPhoneLayer(scope);
    }

    function initFaceDetectionDirective(scope, fPaddingX, fPaddingY) {
        calculateZones(scope);
        var zoom = getFaceZoomFactor(scope, fPaddingX, fPaddingY);
        ZoomUtils.checkZoomFactorAndApply(scope, zoom);
        initImageZoom(scope);
        calculateExistCenterPointCoordinates(scope, parseFloat(scope.face.faceCenterX), parseFloat(scope.face.faceCenterY));
        LayerUtils.initGrayLayer(scope);
        zoomImage(scope);
        LayerUtils.initPhoneLayer(scope);
    }

    function getFaceZoomFactor(scope, fPaddingX, fPaddingY) {
        var facePaddingX = fPaddingX ? parseFloat(fPaddingX) : 0.1;
        var facePaddingY = fPaddingY ? parseFloat(fPaddingY) : 0.1;
        // width and height in range [0,1]
        var AdjustedFaceWidth = Math.max(Math.min(( scope.face.faceWidth ) * ( 1 + ( 2 * facePaddingX ) ), 1), 0);
        var AdjustedFaceHeight = Math.max(Math.min(( scope.face.faceHeight ) * ( 1 + ( 2 * facePaddingY ) ), 1), 0);
        var clearPlace = Math.min(scope.calculated.cleanZoneWidth * scope.imageProps.originalWidth / scope.previewProps.width, scope.calculated.cleanZoneHeight * scope.imageProps.originalHeight / scope.previewProps.height);
        var facePlace = Math.min(AdjustedFaceWidth * scope.imageProps.originalWidth, AdjustedFaceHeight * scope.imageProps.originalHeight);
        // zoom
        return clearPlace / facePlace;
    }

    function calculateExistCenterPointCoordinates(scope, partX, partY) {
        if (partX < 0 || partX > 1 || partY < 0 || partY > 1) {
            return;// parts must be in range [0,1]
        }
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        //min/max position of center Gray zone = red zone + left gray zone + half of clear zone
        var minCenterX = (scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder + scope.calculated.cleanZoneWidth / 2 ) / scope.imageProps.IDW;
        var maxCenterX = 1 - ((scope.calculated.redZoneWidth + scope.calculated.rightGrayBorder + scope.calculated.cleanZoneWidth / 2) / scope.imageProps.IDW);
        var minCenterY = (scope.calculated.redZoneHeight + scope.calculated.topGrayBorder + scope.calculated.cleanZoneHeight / 2 ) / scope.imageProps.IDH;
        var maxCenterY = 1 - ((scope.calculated.redZoneHeight + scope.calculated.bottomGrayBorder + scope.calculated.cleanZoneHeight / 2) / scope.imageProps.IDH);
        //
        //0.0 point for phone
        var leftPhoneCenter = scope.previewProps.width / 2 - displayW / 2;
        var topPhoneCenter = scope.previewProps.height / 2 - displayH / 2;
        setDefaultPhonePosition(scope);
        //in range - no phone move
        if (partX > minCenterX && partX < maxCenterX) {
            scope.moveProps.x = calculateImageMovementX(scope, partX);
        }
        //in range - no phone move
        if (partY > minCenterY && partY < maxCenterY) {
            scope.moveProps.y = calculateImageMovementY(scope, partY);
        }
        //{//make phonePosition
        //    var phonePercent = 0;
        //    var phoneX = 0;
        //    //x position
        //    if (partX > maxCenterX) {
        //        scope.moveProps.x = calculateImageMovementX(scope, maxCenterX);
        //        phonePercent = partX - maxCenterX;
        //        phoneX = scope.imageProps.IDW * phonePercent;
        //        scope.phoneMoveProps.x = leftPhoneCenter + phoneX;
        //    }
        //    if (partX < minCenterX) {
        //        scope.moveProps.x = 1;//no need to move image
        //        phonePercent = minCenterX - partX;
        //        phoneX = scope.imageProps.IDW * phonePercent;
        //        scope.phoneMoveProps.x = leftPhoneCenter - phoneX;
        //    }
        //    //y position
        //    var phoneY = 0;
        //    if (partY > maxCenterY) {
        //        scope.moveProps.y = calculateImageMovementY(scope, maxCenterY);
        //        phonePercent = partY - maxCenterY;
        //        phoneY = scope.imageProps.IDH * phonePercent;
        //        scope.phoneMoveProps.y = topPhoneCenter + phoneY;
        //    }
        //    if (partY < minCenterY) {
        //        scope.moveProps.y = 1;//no need to move image
        //        phonePercent = minCenterY - partY;
        //        phoneY = scope.imageProps.IDH * phonePercent;
        //        scope.phoneMoveProps.y = topPhoneCenter - phoneY;
        //    }
        //}
        var checks = checkPhone(scope);
        scope.phoneMoveProps.x = checks.x;
        scope.phoneMoveProps.y = checks.y;
    }

    function setDefaultPhonePosition(scope) {
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        //0.0 point for phone
        var leftPhoneCenter = scope.previewProps.width / 2 - displayW / 2;
        var topPhoneCenter = scope.previewProps.height / 2 - displayH / 2;
        //default phone position
        scope.phoneMoveProps.x = leftPhoneCenter;
        scope.phoneMoveProps.y = topPhoneCenter - scope.settings.phone.top;
    }

    /**
     *
     * @param scope
     * @param partX - coordinate center X in range [0,1]
     * @returns {number}
     */
    function calculateImageMovementX(scope, partX) {
        var delta = 0.00;
        //IDW - zoomed image width
        return -(((partX - delta) * scope.imageProps.IDW) - (scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder + scope.calculated.cleanZoneWidth / 2));
    }

    function calculateImageMovementY(scope, partY) {
        var delta = 0.00;
        return -(((partY - delta) * scope.imageProps.IDH) - (scope.calculated.redZoneHeight + scope.calculated.topGrayBorder + scope.calculated.cleanZoneHeight / 2));
    }

    /**
     * Zoom image and check that image in view
     * @param scope
     */
    function zoomImage(scope) {
        var checkResult = checkImage(scope);
        // move image
        moveImage(scope, checkResult.x, checkResult.y);
        initImageZoom(scope);
    }

    function checkImage(scope) {
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
        return {
            x: x,
            y: y
        };
    }

    function checkPhone(scope) {
        //left and top checks
        var x = Math.max(0, scope.phoneMoveProps.x);
        var y = Math.max(0, scope.phoneMoveProps.y);
        //
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        var phoneWidth = parseInt(displayW + scope.settings.phone.left + scope.settings.phone.right);
        //for height - use display, because display always in preview form
        if (x + phoneWidth > scope.previewProps.width) {
            x = scope.previewProps.width - phoneWidth + scope.settings.phone.right;
        }
        if (scope.phoneMoveProps.y < scope.settings.phone.top) {
            y = -scope.settings.phone.top;
        }
        if (y + displayH > scope.previewProps.height) {
            y = scope.previewProps.height - displayH - scope.settings.phone.bottom;
        }
        return {
            x: x,
            y: y
        };
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
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        //center
        var leftPoint = scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder;
        var topPoint = scope.calculated.redZoneHeight + scope.calculated.topGrayBorder;
        var centerX = ( leftPoint + scope.calculated.cleanZoneWidth / 2 ) + scope.calculated.leftGrayBorder;
        var centerY = ( topPoint + scope.calculated.cleanZoneHeight / 2 ) + scope.calculated.topGrayBorder;
        //center with image position
        scope.calculated.centerGrayX = ( ( centerX - scope.moveProps.x) / scope.imageProps.IDW );
        scope.calculated.centerGrayY = ( ( centerY - scope.moveProps.y ) / scope.imageProps.IDH );
        //center with phone position
        //0.0 point for phone
        var leftPhoneCenter = (scope.previewProps.width / 2) - (displayW / 2);
        var topPhoneCenter = (scope.previewProps.height / 2) - (displayH / 2);
        //diff for phone
        var diffX = ((leftPhoneCenter - scope.phoneMoveProps.x) / scope.imageProps.IDW);
        var diffY = ((topPhoneCenter - scope.phoneMoveProps.y) / scope.imageProps.IDH);
        //diff in zoomed image (in range 0-1)
        scope.calculated.centerGrayX = scope.calculated.centerGrayX - diffX;
        scope.calculated.centerGrayY = scope.calculated.centerGrayY - diffY;
        return {
            x: scope.calculated.centerGrayX,
            y: scope.calculated.centerGrayY
        }
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
     * Method zooming image depends on zoomFactor (precalculated) without x,y delta
     *
     * @param scope
     */
    function initImageZoom(scope) {
        // ImageDivWidth (IDW)
        scope.imageProps.IDW = scope.imageProps.originalWidth * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        // ImageDivHeight (IDH)
        scope.imageProps.IDH = scope.imageProps.originalHeight * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        scope.layers.imageLayer.css('width', scope.imageProps.IDW);
        scope.layers.imageLayer.css('height', scope.imageProps.IDH);
    }

    function initPhoneMove(scope) {
        scope.layers.phoneLayer.on('mousedown', mouseDown);

        var phonePosition = PhoneUtils.getPhonePosition(scope);
        scope.phoneMoveProps.x = phonePosition.left;
        scope.phoneMoveProps.y = phonePosition.top;

        function mouseDown(event) {
            event.preventDefault();
            scope.phoneMoveProps.startX = event.pageX - scope.phoneMoveProps.x;
            scope.phoneMoveProps.startY = event.pageY - scope.phoneMoveProps.y;
            $log.info(scope.phoneMoveProps.startX, scope.phoneMoveProps.startY);
            //events
            scope.layers.phoneLayer.on('mousemove', mouseMove);
            scope.layers.phoneLayer.on('mouseup', mouseUp);
            scope.layers.directiveElement.on('mouseleave', mouseUp);
            event.stopPropagation();
        }

        function mouseMove(event) {
            __mouseMove(event.pageX, event.pageY);
            event.stopPropagation();
        }

        function __mouseMove(eventX, eventY) {
            var x = eventX - scope.phoneMoveProps.startX;
            var y = eventY - scope.phoneMoveProps.startY;
            //gray borders
            var grayZoneLeft = x + scope.settings.phone.left;
            var grayZoneRight = grayZoneLeft + parseInt(scope.layers.grayLayer.css('width').replace('px', ''));
            var grayZoneTop = y + scope.settings.phone.top;
            var grayZoneBottom = grayZoneTop + parseInt(scope.layers.grayLayer.css('height').replace('px', ''));
            //checks
            if (grayZoneLeft > 0 && grayZoneRight < scope.previewProps.width) {
                scope.phoneMoveProps.x = x;
                scope.layers.phoneLayer.css({
                    left: x + 'px'
                });
                scope.layers.grayLayer.css({
                    left: x + scope.settings.phone.left + 'px'
                });
            }
            if (grayZoneTop > 0 && grayZoneBottom < scope.previewProps.height) {
                scope.phoneMoveProps.y = y;
                scope.layers.phoneLayer.css({
                    top: y + 'px'
                });
                scope.layers.grayLayer.css({
                    top: y + scope.settings.phone.top + 'px'
                });
            }
            PhoneUtils.calculateDisplayCenter(scope);
            fillResult(scope);
        }

        function mouseUp() {
            scope.layers.phoneLayer.off('mousemove', mouseMove);
            scope.layers.phoneLayer.off('mouseup', mouseUp);
        }
    }

    function initImageMove(scope) {
        scope.layers.glassLayer.on('mousedown', mouseDown);
        scope.layers.phoneLayer.find('.phone-display').on('mousedown', mouseDown);

        function mouseDown(event) {
            event.preventDefault();
            scope.moveProps.startX = event.pageX - scope.moveProps.x;
            scope.moveProps.startY = event.pageY - scope.moveProps.y;
            //events
            scope.layers.glassLayer.on('mousemove', mouseMove);
            scope.layers.glassLayer.on('mouseup', mouseUp);
            //
            scope.layers.phoneLayer.find('.phone-display').on('mousemove', mouseMove);
            scope.layers.phoneLayer.find('.phone-display').on('mouseup', mouseUp);
            //
            scope.layers.directiveElement.on('mouseleave', mouseUp);
            //init params
            scope.layers.imageLayer.css({
                left: scope.moveProps.x + 'px',
                top: scope.moveProps.y + 'px'
            });
            event.stopPropagation();
        }

        function mouseMove(event) {
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
            event.stopPropagation();
        }

        function mouseUp() {
            scope.layers.glassLayer.off('mousemove', mouseMove);
            scope.layers.phoneLayer.find('.phone-display').off('mousemove', mouseMove);
            scope.layers.glassLayer.off('mouseup', mouseUp);
            scope.layers.phoneLayer.find('.phone-display').off('mouseup', mouseUp);
        }
    }

    return {
        scope: {
            imgSrc: '@',
            ui: '@',
            callBackMethod: '&resultFunc'
        },
        template: '<div class="phone-layer">' +
        '<div class="phone-camera phone-top-additional"/>' +
        '<div class="phone-dynamic phone-top-additional"/>' +
        '<div class="phone-display"/>' +
        '<div class="phone-button">' +
        '<div class="phone-sub-button"/>' +
        '</div>' +
        '</div>' +
        '<div class="glass-wrapper">' +
        '<div class="glass">' +
            //red - deprecated
        '<div class="red black-border hidden"></div>' +
        '<div class="gray white-border"></div>' +
        '<img class="cropped-image" ng-src="{{imgSrc}}"/>' +
        '</div>' +
        '</div>' +
        '<div class="control-wrapper" ng-class="{ \'hidden\' : calculated.MAXZF == 0}">' +
        '<slider ng-class="{ \'hidden\' : calculated.MAXZF == calculated.MINZF}"' + 'ng-model="calculated.zoomFactor"' + 'min="calculated.MINZF"' + 'step="calculated.zoomStep"' + 'precision="4"' + 'max="calculated.MAXZF"' + 'value="calculated.zoomFactor" formatter="formatZoomFactor">' +
        '</slider>' +
        '<span ng-class="{ \'hidden\' : calculated.MAXZF != calculated.MINZF}" class="control-message">' + 'Zooming not available: low-res image' +
        '</span>' +
        '</div>',
        restrict: 'E',
        link: link
    }
}]);
