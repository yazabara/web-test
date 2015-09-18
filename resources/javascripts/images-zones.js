'use strict';

var imagesApp = angular.module('ImageZonesApp', [], function () {

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
}]);

imagesApp.directive('layerImage', ['$log', 'SETTINGS', '$document', function ($log, SETTINGS, $document) {


    function link(scope, element, attrs) {
        //init all props
        scope.moveProps = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            wDelta: 0,//clear zone delta
            hDelta: 0//clear zone delta
        };

        scope.selectors = {
            backgroundImage: '.back-layer-image',
            croppedImage: '.cropped-image',
            cropBox: '.crop-box'
        };

        scope.imageProps = {
            url: '',//Image url
            height: 0,// Image Height (IH)
            width: 0, // ImageWidth (IW)
            aspectRatio: 0// Image Aspect Ratio (IAR)
        };

        scope.previewProps = {
            zoomFactor: 1,
            height: 0,// PreviewHeight (PH) - the height of the image preview is (fixed in the HTML layout)
            width: 0 // PreviewWidth  (PW)- the width of the image preview is (fixed in the HTML layout)
        };


        //fill all props
        var backgroundImageElement = element.find(scope.selectors.backgroundImage);
        var croppedImageElement = element.find(scope.selectors.croppedImage);
        var cropBoxElement = element.find(scope.selectors.cropBox);

        backgroundImageElement.bind('load', function () {
                //fill image props
                angular.extend(scope.imageProps, {
                    width: this.naturalWidth,
                    height: this.naturalHeight,
                    url: scope.imgSrc,
                    aspectRatio: this.naturalHeight == 0 ? 1 : this.naturalWidth / this.naturalHeight
                });
                $log.info('Image: (w: ' + scope.imageProps.width + ', h: ' + scope.imageProps.height + ', ap: ' + scope.imageProps.aspectRatio + ')');
                //fill preview props
                angular.extend(scope.previewProps, {
                    width: attrs.width,//backgroundImageElement.width(),
                    height: attrs.width/*backgroundImageElement.width()*/ / scope.imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
                    zoomFactor: !scope.zoomFactor ? 1 : parseFloat(scope.zoomFactor)
                });

                element.css('width',  scope.previewProps.width);
                element.css('height', scope.previewProps.height);


                $log.info('Preview: (w: ' + scope.previewProps.width + ', h(PH = PW / IAR): ' + scope.previewProps.height + ', original height: ' + element.height() + ')');

                initClearZone(scope, calculating(scope)/*clear zone coordinates*/, cropBoxElement, croppedImageElement, backgroundImageElement);
            }
        );
    }

    function initClearZone(scope, clearZoneCoordinates, cropBoxElement, croppedImageElement, backgroundImageElement) {
        cropBoxElement.css('width', clearZoneCoordinates.width);
        cropBoxElement.css('height', clearZoneCoordinates.height);

        //calculate delta (for clear zone)
        scope.moveProps.wDelta = (scope.imageProps.width - clearZoneCoordinates.width) / 2;
        scope.moveProps.hDelta = (scope.imageProps.height - clearZoneCoordinates.height) / 2;

        cropBoxElement.css('left', scope.moveProps.wDelta);
        cropBoxElement.css('top', scope.moveProps.hDelta);

        zoomImage(croppedImageElement, scope.previewProps.zoomFactor);
        zoomImage(backgroundImageElement, scope.previewProps.zoomFactor);

        //ini movement
        initImageMove(scope, cropBoxElement, croppedImageElement, backgroundImageElement, clearZoneCoordinates);

        croppedImageElement.css('left', (scope.moveProps.x - scope.moveProps.wDelta));
        croppedImageElement.css('top', (scope.moveProps.y - scope.moveProps.hDelta));
    }

    function initImageMove(scope, cropBoxElement, croppedImage, backgroundImage, clearZoneCoordinates) {

        croppedImage.on('mousedown', function (event) {
            // Prevent default dragging of selected content
            event.preventDefault();
            scope.moveProps.startX = event.pageX - scope.moveProps.x;
            scope.moveProps.startY = event.pageY - scope.moveProps.y;
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
            var x = event.pageX - scope.moveProps.startX;
            var y = event.pageY - scope.moveProps.startY;
            var newX = (x - scope.moveProps.wDelta);
            var newY = (y - scope.moveProps.hDelta);

            //change place if coordinates in box
            if ((newX < 0 && newX > 0 - (scope.imageProps.width - clearZoneCoordinates.width)) && (newY < 0 && newY > 0 - (scope.imageProps.height - clearZoneCoordinates.height))) {

                $log.info(newX + ' , ' + newY);

                scope.moveProps.y = y;
                scope.moveProps.x = x;
                croppedImage.css({
                    top: newY + 'px',
                    left: newX + 'px'
                });
                backgroundImage.css({
                    top: scope.moveProps.y + 'px',
                    left: scope.moveProps.x + 'px'
                });
            }
        }

        function mouseup() {
            $document.off('mousemove', mousemove);
            $document.off('mouseup', mouseup);
        }
    }

    //TODO Deprecated
    function zoomImage(element, zoom) {
        /* Safari and Chrome */
        element.css('-webkit-transform', 'scale(' + zoom + ')');
        /* Firefox */
        element.css('-moz-transform', 'scale(' + zoom + ')');
        /* IE 9 */
        element.css('-ms-transform', 'scale(' + zoom + ')');
        /* Opera */
        element.css('-o-transform', 'scale(' + zoom + ')');
        /* Common */
        element.css('transform', 'scale(' + zoom + ')');
    }

    function calculating(scope) {
        var Devices = SETTINGS.Devices;
        var UI = SETTINGS.UI;
        var ZF = scope.previewProps.zoomFactor;

        // WorstCaseProtraitAspectRatio (WCPAR)
        var WCPAR = Math.min(Devices.Portrait.AspectRatio.Low, Devices.Portrait.AspectRatio.High);

        // WorstCaseLandscapeAspectRatio (WCLAR)
        var WCLAR = Math.max(Devices.Landscape.AspectRatio.Low, Devices.Landscape.AspectRatio.High);

        // MaxDeviceHeight (MAXDH)
        var MAXDH = Math.max(Devices.Portrait.ScreenSize.Height.Max, Devices.Landscape.ScreenSize.Height.Max);

        var MAXDW = Math.max(Devices.Portrait.ScreenSize.Width.Max, Devices.Landscape.ScreenSize.Width.Max);

        //TODO ???????????
        // MinZoomFactor (MINZF)
        var MINZF = Math.max(MAXDW / scope.imageProps.width, MAXDH / scope.imageProps.height);

        // MaxZoonFactor (MAXZF)
        var MAXZF = ( MINZF >= 1 ? MINZF : Math.min(scope.imageProps.width / MAXDW, scope.imageProps.height / MAXDW) );
        // note: MAXZF==MINZF means that no zooming is allowed

        // ImageDivWidth (IDW)
        var IDW = scope.imageProps.width * ZF;

        // ImageDivHeight (IDH)
        var IDH = scope.imageProps.height * ZF;

        // PortraitCropRectangleWidth (PCRW)
        var PCRW = scope.previewProps.width * WCPAR;

        // LandscapeCropRectangleHeight (LCRH)
        var LCRH = scope.previewProps.height / WCLAR;

        // ShortestPortraitCropRectangleHeight (SPCRH)
        var SPCRH = PCRW / Devices.Portrait.AspectRatio.High;

        // NarrowestLandscapeCropRectangleWidth (NLCRW)
        var NLCRW = scope.previewProps.width * Devices.Landscape.AspectRatio.Low;

        // UI Portrait Relative Offsets
        var UIPROL = UI.Overlays.Portrait.Left / Devices.Portrait.ScreenSize.Width.Min;
        var UIPROT = UI.Overlays.Portrait.Top / Devices.Portrait.ScreenSize.Height.Min;
        var UIPROR = UI.Overlays.Portrait.Right / Devices.Portrait.ScreenSize.Width.Min;
        var UIPROB = UI.Overlays.Portrait.Bottom / Devices.Portrait.ScreenSize.Height.Min;

        // UI Landscape Relative Offsets
        var UILROL = UI.Overlays.Landscape.Left / Devices.Landscape.ScreenSize.Width.Min;
        var UILROT = UI.Overlays.Landscape.Top / Devices.Landscape.ScreenSize.Height.Min;
        var UILROR = UI.Overlays.Landscape.Right / Devices.Landscape.ScreenSize.Width.Min;
        var UILROB = UI.Overlays.Landscape.Bottom / Devices.Landscape.ScreenSize.Height.Min;


        // UI Portrait Overlay Actual Px Offsets
        var UIPAOL = UIPROL * PCRW;
        var UIPAOT = UIPROT * SPCRH;//TODO
        var UIPAOR = UIPROR * PCRW;
        var UIPAOB = UIPROB * SPCRH;//TODO

        // UI Lvar ndscape Overlay Actual Px Offsets
        var UILAOL = UILROL * NLCRW;//TODO
        var UILAOT = UILROT * LCRH;
        var UILAOR = UILROR * NLCRW;//TODO
        var UILAOB = UILROB * LCRH;

        // Clear Zone Size
        var CZW = Math.min(NLCRW - UILROL - UILROR, PCRW - UIPAOL - UIPAOR);
        var CZH = Math.min(SPCRH - UIPROT - UIPROB, LCRH - UILAOT - UILAOB);

        $log.info('Clear zone: ' + CZW + ', ' + CZH);
        return {
            width: CZW,
            height: CZH
        };
    }

    return {
        scope: {
            imgSrc: '@',
            zoomFactor: '@'
        },
        templateUrl: "templates/image-zones-template.html",
        restrict: 'E',
        link: link
    }
}])
;