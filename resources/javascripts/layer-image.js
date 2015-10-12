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
            controlHeight: 100,
            phone: {
                left: 10,
                top: 40,
                right: 10,
                bottom: 50
            }
            //phone: {
            //    left: 4,
            //    top: 20,
            //    right: 4,
            //    bottom: 30
            //}
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
            // fill preview props
            angular.extend(scope.previewProps, {
                width: attrs.width,
                height: attrs.width / Math.max(Devices.portrait.aspectRatio.high, Devices.landscape.aspectRatio.high)
            });
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

            //params exists
            if (attrs.centerX && attrs.centerY && attrs.zoomFactor && ( attrs.centerX != '0' && attrs.centerY != '0' && attrs.zoomFactor != '0' )) {
                initExistDirective(scope, attrs.zoomFactor, attrs.centerX, attrs.centerY);
            }
            else if (attrs.face) {//face exist
                scope.face = JSON.parse(attrs.face);
                initFaceDetectionDirective(scope, attrs.facePaddingX, attrs.facePaddingY);
            }
            else {//default directive
                initDefaultDirective(scope);
            }
            initImageMove(scope);
            // zoom factor changes listener
            scope.$watch('calculated.zoomFactor', function (newValue, oldValue) {
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
        //zoom
        checkZoomFactorAndApply(scope, parseFloat(zoomFactor));
        initImageZoom(scope);
        //calculate basic params
        calculateLayers(scope);
        //get center
        calculateExistCenterPointCoordinates(scope, parseFloat(centerX), parseFloat(centerY));
        //fill gray zone
        initGrayZone(scope);
        //check and zoom
        zoomImage(scope);
        initPhoneLayer(scope);
    }

    function initDefaultDirective(scope) {
        // recalculate zoomFactor
        initZoomFactor(scope);
        // calculate layers borders
        calculateLayers(scope);
        initGrayZone(scope);
        zoomImage(scope);
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
        initGrayZone(scope);
        zoomImage(scope);
        initPhoneLayer(scope);
    }

    function calculateExistCenterPointCoordinates(scope, partX, partY) {
        if (partX < 0 || partX > 1 || partY < 0 || partY > 1) {
            return;// parts must be in range [0,1]
        }
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);

        //min/max center of gray zone
        var tmpW = (displayW / 2 + scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder + scope.calculated.rightGrayBorder) / scope.imageProps.IDW;
        var tmpH = (displayH / 2 + scope.calculated.redZoneHeight + scope.c) / scope.imageProps.IDH;

        var leftCenter = (displayW / 2 + scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder) / scope.imageProps.IDW;
        var rightCenter = 1 - ((displayW / 2 + scope.calculated.redZoneWidth + scope.calculated.rightGrayBorder) / scope.imageProps.IDW);

        $log.info('r ' + rightCenter + 'l : ' + leftCenter);

        {//calculate ideal gray zone
            var leftPoint = scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder;
            var topPoint = scope.calculated.redZoneHeight + scope.calculated.topGrayBorder;
            var centerX = ( leftPoint + displayW / 2 );
            var centerY = ( topPoint + displayH / 2 );
            //ideal way - in center
            var centerGrayX = ( ( centerX - scope.moveProps.x ) / scope.imageProps.IDW );
            var centerGrayY = ( ( centerY - scope.moveProps.y ) / scope.imageProps.IDH );
        }

        //in range - no phone move
        if (partX > leftCenter && partX < rightCenter) {
            calculateImageMovement(scope, partX, partY);
        } else {
            if (partX > rightCenter) {
                scope.moveProps.x = -(scope.imageProps.IDW - scope.previewProps.width) * rightCenter - scope.calculated.leftGrayBorder;
                scope.phoneMoveProps.x = scope.imageProps.IDW * (centerGrayX - (partX - rightCenter));
            }
            if (partX < leftCenter) {
                scope.moveProps.x = 0;//no need to move image
                scope.phoneMoveProps.x = scope.imageProps.IDW * (centerGrayX - (partX - rightCenter));
            }
        }
    }

    /**
     * Calculate scope.moveProps.x scope.moveProps.y conected with partX and partY (in range 0-1)
     * @param scope
     * @param partX
     * @param partY
     */
    function calculateImageMovement(scope, partX, partY) {
        scope.moveProps.x = -(scope.imageProps.IDW - scope.previewProps.width) * partX - scope.calculated.leftGrayBorder;
        scope.moveProps.y = -(scope.imageProps.IDH - scope.previewProps.width) * partY - scope.calculated.topGrayBorder;
    }

    /**
     * Zoom image and check that image in view
     * @param scope
     */
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
        scope.calculated.zoomFactor = ( zoomFactor >= scope.calculated.MINZF && zoomFactor <= scope.calculated.MAXZF ) ? zoomFactor : ( zoomFactor < scope.calculated.MINZF ? scope.calculated.MINZF : scope.calculated.MAXZF );
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
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        //center
        var leftPoint = scope.calculated.redZoneWidth + scope.calculated.leftGrayBorder;
        var topPoint = scope.calculated.redZoneHeight + scope.calculated.topGrayBorder;
        var centerX = ( leftPoint + displayW / 2 ) + scope.calculated.leftGrayBorder;
        var centerY = ( topPoint + displayH / 2 ) + scope.calculated.topGrayBorder;
        //center with image position
        scope.calculated.centerGrayX = ( ( centerX - scope.moveProps.x) / scope.imageProps.IDW );// + (scope.phoneMoveProps.x / scope.imageProps.IDW);
        scope.calculated.centerGrayY = ( ( centerY - scope.moveProps.y ) / scope.imageProps.IDH );// + (scope.phoneMoveProps.y / scope.imageProps.IDH);
        //center with phone position
        //0.0 point for phone
        var leftPhoneCenter = scope.previewProps.width / 2 - displayW / 2;
        var topPhoneCenter = scope.previewProps.height / 2 - displayH / 2;

        var diffX = ((leftPhoneCenter - scope.phoneMoveProps.x) / scope.imageProps.IDW) * scope.calculated.zoomFactor;
        var diffY = ((topPhoneCenter - scope.phoneMoveProps.y) / scope.imageProps.IDH) * scope.calculated.zoomFactor;
        //diff in zoomed image (in range 0-1)
        scope.calculated.centerGrayX = scope.calculated.centerGrayX - diffX;
        scope.calculated.centerGrayY = scope.calculated.centerGrayY - diffY;
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
        scope.layers.imageLayer.css('width', scope.imageProps.IDW);
        scope.layers.imageLayer.css('height', scope.imageProps.IDH);
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
        var displayW = parseInt(scope.previewProps.width - 2 * scope.calculated.redZoneWidth);
        var displayH = parseInt(scope.previewProps.height - 2 * scope.calculated.redZoneHeight);
        var phoneWidth = parseInt(displayW + scope.settings.phone.left + scope.settings.phone.right);
        var phoneHeight = parseInt(displayH + scope.settings.phone.top + scope.settings.phone.bottom);
        //phone
        setElementSize(scope.layers.phoneLayer, phoneWidth, phoneHeight);
        scope.layers.phoneLayer.css('left', scope.calculated.redZoneWidth - scope.settings.phone.left);
        scope.layers.phoneLayer.css('top', scope.calculated.redZoneHeight - scope.settings.phone.top);
        scope.layers.phoneLayer.css('border-radius', (scope.settings.phone.top + scope.settings.phone.bottom + scope.settings.phone.left + scope.settings.phone.right) / 4);
        //camera
        var circleDimension = parseInt(scope.settings.phone.top / 3);
        setElementSize(scope.layers.phoneLayer.find('.phone-camera'), circleDimension, circleDimension);
        scope.layers.phoneLayer.find('.phone-camera').css('top', -(scope.settings.phone.top / 2) - (circleDimension / 2));
        scope.layers.phoneLayer.find('.phone-camera').css('left', (phoneWidth / 4) - scope.settings.phone.left);
        //dynamic
        var lineW = displayW / 4;
        var lineH = scope.settings.phone.top / 7;
        setElementSize(scope.layers.phoneLayer.find('.phone-dynamic'), lineW, lineH);
        scope.layers.phoneLayer.find('.phone-dynamic').css('top', -(scope.settings.phone.top / 2) - (lineH / 2));
        scope.layers.phoneLayer.find('.phone-dynamic').css('left', (phoneWidth / 2) - (lineW / 2) - scope.settings.phone.left);
        //background
        scope.layers.phoneLayer.css('border-top', 'black ' + scope.settings.phone.top + 'px solid');
        scope.layers.phoneLayer.css('border-bottom', 'black ' + scope.settings.phone.bottom + 'px solid');
        scope.layers.phoneLayer.css('border-right', 'black ' + (scope.settings.phone.right + 2) + 'px solid');
        scope.layers.phoneLayer.css('border-left', 'black ' + (scope.settings.phone.left + 2) + 'px solid');
        scope.layers.phoneLayer.css('padding-left', (phoneWidth - (scope.settings.phone.left + scope.settings.phone.right)) + 'px');
        scope.layers.phoneLayer.css('padding-top', (phoneHeight - (scope.settings.phone.top + scope.settings.phone.bottom)) + 'px');
        //display
        setElementSize(scope.layers.phoneLayer.find('.phone-display'), displayW, displayH);
        //button
        var buttonDimension = parseInt(scope.settings.phone.bottom / 1.5);
        setElementSize(scope.layers.phoneLayer.find('.phone-button'), buttonDimension, buttonDimension);
        scope.layers.phoneLayer.find('.phone-button').css('bottom', -(scope.settings.phone.bottom / 2) - (buttonDimension / 2));
        scope.layers.phoneLayer.find('.phone-button').css('left', ((phoneWidth / 2) - (buttonDimension / 2) - scope.settings.phone.left));
        //sub-button
        var subButtonDimension = parseInt(buttonDimension / 2);
        setElementSize(scope.layers.phoneLayer.find('.phone-sub-button'), subButtonDimension, subButtonDimension);
        scope.layers.phoneLayer.find('.phone-sub-button').css('bottom', parseInt(subButtonDimension) - (subButtonDimension / 2) - 1);
        scope.layers.phoneLayer.find('.phone-sub-button').css('left', parseInt(subButtonDimension - (subButtonDimension / 2)) - 1);
        initPhoneMove(scope);
    }

    function initPhoneMove(scope) {
        scope.layers.phoneLayer.on('mousedown', mouseDown);
        //init params
        //scope.phoneMoveProps.x = parseInt(scope.layers.phoneLayer.css('left').replace('px', ''));
        //scope.phoneMoveProps.y = parseInt(scope.layers.phoneLayer.css('top').replace('px', ''));

        scope.layers.phoneLayer.css('left', scope.phoneMoveProps.x);
        scope.layers.phoneLayer.css('top', scope.phoneMoveProps.y);

        function mouseDown(event) {
            event.preventDefault();
            scope.phoneMoveProps.startX = event.pageX - scope.phoneMoveProps.x;
            scope.phoneMoveProps.startY = event.pageY - scope.phoneMoveProps.y;
            //events
            scope.layers.phoneLayer.on('mousemove', mouseMove);
            scope.layers.phoneLayer.on('mouseup', mouseUp);
            scope.layers.directiveElement.on('mouseleave', mouseUp);
            //init params
            scope.layers.phoneLayer.css({
                left: scope.phoneMoveProps.x + 'px',
                top: scope.phoneMoveProps.y + 'px'
            });
            event.stopPropagation();
        }

        function mouseMove(event) {
            var x = event.pageX - scope.phoneMoveProps.startX;
            var y = event.pageY - scope.phoneMoveProps.startY;
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
            fillResult(scope);
            event.stopPropagation();
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

        // Red Zone Size
        scope.calculated.redZoneWidth = ( scope.previewProps.width - scope.calculated.PCRW ) / 2;
        scope.calculated.redZoneHeight = ( scope.previewProps.height - scope.calculated.LCRH ) / 2;
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
        '<slider ng-class="{ \'hidden\' : calculated.MAXZF == calculated.MINZF}"' + 'ng-model="calculated.zoomFactor"' + 'min="calculated.MINZF"' + 'step="calculated.zoomStep"' + 'precision="4"' + 'max="calculated.MAXZF"' + 'value="calculated.zoomFactor">' +
        '</slider>' +
        '<span ng-class="{ \'hidden\' : calculated.MAXZF != calculated.MINZF}" class="control-message">' + 'Zooming not available: low-res image' +
        '</span>' +
        '</div>',
        restrict: 'E',
        link: link
    }
}]);