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

    var moveProps = {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        wDelta: 0,//clear zone delta
        hDelta: 0//clear zone delta
    };

    var selectors = {
        backgroundImage: '.back-layer-image',
        croppedImage: '.cropped-image',
        cropBox: '.crop-box'
    };

    var imageProps = {
        url: '',//Image url
        height: 0,// Image Height (IH)
        width: 0, // ImageWidth (IW)
        aspectRatio: 0// Image Aspect Ratio (IAR)
    };

    var previewProps = {
        zoomFactor: 1,
        height: 0,// PreviewHeight (PH) - the height of the image preview is (fixed in the HTML layout)
        width: 0 // PreviewWidth  (PW)- the width of the image preview is (fixed in the HTML layout)
    };

    function link(scope, element, attrs) {
        var backgroundImageElement = element.find(selectors.backgroundImage);
        var croppedImageElement = element.find(selectors.croppedImage);
        var cropBoxElement = element.find(selectors.cropBox);

        backgroundImageElement.bind('load', function () {
                //fill image props
                angular.extend(imageProps, {
                    width: this.naturalWidth,
                    height: this.naturalHeight,
                    url: scope.imgSrc,
                    aspectRatio: this.naturalHeight == 0 ? 1 : this.naturalWidth / this.naturalHeight
                });
                $log.info('Image: (w: ' + imageProps.width + ', h: ' + imageProps.height + ', ap: ' + imageProps.aspectRatio + ')');
                //fill preview props
                angular.extend(previewProps, {
                    width: backgroundImageElement.width(),
                    height: backgroundImageElement.width() / imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
                    zoomFactor: !scope.zoomFactor ? 1 : parseFloat(scope.zoomFactor)
                });
                $log.info('Preview: (w: ' + previewProps.width + ', h(PH = PW / IAR): ' + previewProps.height + ', original height: ' + element.height() + ')');

                var clearZoneCoordinates = calculating();
                initClearZone(clearZoneCoordinates, cropBoxElement, croppedImageElement, backgroundImageElement);


            }
        );
    }

    function initClearZone(clearZoneCoordinates, cropBoxElement, croppedImageElement, backgroundImageElement) {
        cropBoxElement.css('width', clearZoneCoordinates.width);
        cropBoxElement.css('height', clearZoneCoordinates.height);

        //calculate delta (for clear zone)
        moveProps.wDelta = (imageProps.width - clearZoneCoordinates.width) / 2;
        moveProps.hDelta = (imageProps.height - clearZoneCoordinates.height) / 2;

        cropBoxElement.css('left', moveProps.wDelta);
        cropBoxElement.css('top', moveProps.hDelta);

        //ini movement
        initImageMove(cropBoxElement, croppedImageElement, backgroundImageElement, clearZoneCoordinates);

        croppedImageElement.css('left', (moveProps.x - moveProps.wDelta));
        croppedImageElement.css('top', (moveProps.y - moveProps.hDelta));
    }

    function initImageMove(cropBoxElement, croppedImage, backgroundImage, clearZoneCoordinates) {

        croppedImage.on('mousedown', function (event) {
            // Prevent default dragging of selected content
            event.preventDefault();
            moveProps.startX = event.pageX - moveProps.x;
            moveProps.startY = event.pageY - moveProps.y;
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
            var x = event.pageX - moveProps.startX;
            var y = event.pageY - moveProps.startY;
            var newX = (x - moveProps.wDelta);
            var newY = (y - moveProps.hDelta);

            //change place if coordinates in box
            if ((newX < 0 && newX > 0 - (imageProps.width - clearZoneCoordinates.width)) && (newY < 0 && newY > 0 - (imageProps.height - clearZoneCoordinates.height))) {
                moveProps.y = y;
                moveProps.x = x;
                croppedImage.css({
                    top: newY + 'px',
                    left: newX + 'px'
                });
                backgroundImage.css({
                    top: moveProps.y + 'px',
                    left: moveProps.x + 'px'
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

    function calculating() {
        var Devices = SETTINGS.Devices;
        var UI = SETTINGS.UI;
        var ZF = previewProps.zoomFactor;

        // WorstCaseProtraitAspectRatio (WCPAR)
        var WCPAR = Math.min(Devices.Portrait.AspectRatio.Low, Devices.Portrait.AspectRatio.High);

        // WorstCaseLandscapeAspectRatio (WCLAR)
        var WCLAR = Math.max(Devices.Landscape.AspectRatio.Low, Devices.Landscape.AspectRatio.High);

        // MaxDeviceHeight (MAXDH)
        var MAXDH = Math.max(Devices.Portrait.ScreenSize.Height.Max, Devices.Landscape.ScreenSize.Height.Max);

        var MAXDW = Math.max(Devices.Portrait.ScreenSize.Width.Max, Devices.Landscape.ScreenSize.Width.Max);

        // MinZoomFactor (MINZF)
        var MINZF = Math.max(MAXDW / imageProps.width, MAXDH / imageProps.height);

        // MaxZoonFactor (MAXZF)
        var MAXZF = ( MINZF >= 1 ? MINZF : Math.min(imageProps.width / MAXDW, imageProps.height / MAXDW) );
        // note: MAXZF==MINZF means that no zooming is allowed

        // ImageDivWidth (IDW)
        var IDW = imageProps.width * ZF;

        // ImageDivHeight (IDH)
        var IDH = imageProps.height * ZF;

        // PortraitCropRectangleWidth (PCRW)
        var PCRW = previewProps.width * WCPAR;

        // LandscapeCropRectangleHeight (LCRH)
        var LCRH = previewProps.height / WCLAR;

        // ShortestPortraitCropRectangleHeight (SPCRH)
        var SPCRH = PCRW / Devices.Portrait.AspectRatio.High;

        // NarrowestLandscapeCropRectangleWidth (NLCRW)
        var NLCRW = previewProps.width * Devices.Landscape.AspectRatio.Low;

        // UI Portrait Relative Offsets
        var UIPROL = UI.Overlays.Portrait.Left / Devices.Portrait.ScreenSize.Width.Min;
        var UIPROT = UI.Overlays.Portrait.Top / Devices.Portrait.ScreenSize.Height.Min;
        var UIPROR = UI.Overlays.Portrait.Right / Devices.Portrait.ScreenSize.Width.Min;
        var UIPROB = UI.Overlays.Portrait.Bottom / Devices.Portrait.ScreenSize.Height.Min;

        // UI Lavar ndscape Relative Offsets
        var UILROL = UI.Overlays.Landscape.Left / Devices.Landscape.ScreenSize.Width.Min;
        var UILROT = UI.Overlays.Landscape.Top / Devices.Landscape.ScreenSize.Height.Min;
        var UILROR = UI.Overlays.Landscape.Right / Devices.Landscape.ScreenSize.Width.Min;
        var UILROB = UI.Overlays.Landscape.Bottom / Devices.Landscape.ScreenSize.Height.Min;


        // UI Portrait Overlay Actual Px Offsets
        var UIPAOL = UIPROL * PCRW;
        var UIPAOT = UIPROT * SPCRH;
        var UIPAOR = UIPROR * PCRW;
        var UIPAOB = UIPROB * SPCRH;

        // UI Lvar ndscape Overlay Actual Px Offsets
        var UILAOL = UILROL * NLCRW;
        var UILAOT = UILROT * LCRH;
        var UILAOR = UILROR * NLCRW;
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
        templateUrl: "layer-image-template.html",
        restrict: 'E',
        link: link
    }
}])
;