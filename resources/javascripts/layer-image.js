'use strict';

var imagesApp = angular.module('LayersImageApp', [], function () {

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
        var Devices = SETTINGS.Devices;
        var UI = SETTINGS.UI;
        //movement props
        scope.moveProps = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            wDelta: 0,//clear zone delta
            hDelta: 0//clear zone delta
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
            CZW: 0,
            CZH: 0
        };

        //selectors
        scope.laers = {
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
        scope.laers.imageLayer.bind('load', function () {
                //fill image props
                angular.extend(scope.imageProps, {
                    originalWidth: this.naturalWidth,
                    originalHeight: this.naturalHeight,
                    aspectRatio: this.naturalHeight == 0 ? 1 : this.naturalWidth / this.naturalHeight
                });
                $log.info('Image: (w: ' + scope.imageProps.originalWidth + ', h: ' + scope.imageProps.originalHeight + ', ap: ' + scope.imageProps.aspectRatio + ')');
                //fill preview props
                angular.extend(scope.previewProps, {
                    width: attrs.width,
                    height: attrs.width / scope.imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
                    zoomFactor: !scope.zoomFactor ? 1 : parseFloat(scope.zoomFactor)
                });
                $log.info('Preview: (w: ' + scope.previewProps.width + ', h(PH = PW / IAR): ' + scope.previewProps.height + ', original height: ' + element.height() + ')');
                //set preview size
                element.css('width', scope.previewProps.width);
                element.css('height', scope.previewProps.height);
                //recalculate zoomFactor
                calculateZoomFactor(scope);
                initImageZoom(scope);
                //calculate layers borders
                calculateLayers(scope);
            }
        );
    }

    /**
     * Method calculate zoomFactor connected with settings and image original size
     * @param scope
     */
    //TODO ?? ????? ??? ?????? ?? ???????? ?? preview width ? preview height,?.?. ?????????? ? ???
    function calculateZoomFactor(scope) {
        var Devices = SETTINGS.Devices;
        // MaxDeviceHeight (MAXDH)
        var MAXDH = Math.max(Devices.Portrait.ScreenSize.Height.Max, Devices.Landscape.ScreenSize.Height.Max);
        // MaxDeviceWidth (MAXDH)
        var MAXDW = Math.max(Devices.Portrait.ScreenSize.Width.Max, Devices.Landscape.ScreenSize.Width.Max);
        // MinZoomFactor (MINZF)
        var MINZF = Math.min(MAXDW / scope.imageProps.originalWidth, MAXDH / scope.imageProps.originalHeight);
        // MaxZoomFactor (MAXZF)
        var MAXZF = ( MINZF >= 1 ? MINZF : Math.min(scope.imageProps.originalWidth / MAXDW, scope.imageProps.originalHeight / MAXDW) );
        // note: MAXZF==MINZF means that no zooming is allowed

        //zoomFactor = current zoom factor or min
        scope.previewProps.zoomFactor = (!scope.previewProps.zoomFactor || (scope.previewProps.zoomFactor < MAXZF && scope.previewProps.zoomFactor >= MINZF)) ? scope.previewProps.zoomFactor : MINZF;
        $log.info('MINZF = ' + MINZF + ' , MAXZF = ' + MAXZF + ' , zoomFactor = ' + scope.previewProps.zoomFactor);
    }

    /**
     * Method zooming image depends on zoomFactor (precalculated)
     * @param scope
     */
    function initImageZoom(scope) {
        // ImageDivWidth (IDW)
        scope.imageProps.IDW = scope.imageProps.originalWidth * scope.previewProps.zoomFactor;
        // ImageDivHeight (IDH)
        scope.imageProps.IDH = scope.imageProps.originalHeight * scope.previewProps.zoomFactor;
        $log.info('IDW = ' + scope.imageProps.IDW + ' , IDH = ' + scope.imageProps.IDH);
        scope.laers.imageLayer.css('width', scope.imageProps.IDW);
        scope.laers.imageLayer.css('height', scope.imageProps.IDH);
    }

    function initRedZone(scope) {

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
        scope.calculated.UIPAOT = scope.calculated.UIPROT * scope.calculated.SPCRH;//TODO
        scope.calculated.UIPAOR = scope.calculated.UIPROR * scope.calculated.PCRW;
        scope.calculated.UIPAOB = scope.calculated.UIPROB * scope.calculated.SPCRH;//TODO
        // UI Lvar ndscape Overlay Actual Px Offsets
        scope.calculated.UILAOL = scope.calculated.UILROL * scope.calculated.NLCRW;//TODO
        scope.calculated.UILAOT = scope.calculated.UILROT * scope.calculated.LCRH;
        scope.calculated.UILAOR = scope.calculated.UILROR * scope.calculated.NLCRW;//TODO
        scope.calculated.UILAOB = scope.calculated.UILROB * scope.calculated.LCRH;
        // Clear Zone Size
        scope.calculated.CZW = Math.min(scope.calculated.NLCRW - scope.calculated.UILROL - scope.calculated.UILROR, scope.calculated.PCRW - scope.calculated.UIPAOL - scope.calculated.UIPAOR);
        scope.calculated.CZH = Math.min(scope.calculated.SPCRH - scope.calculated.UIPROT - scope.calculated.UIPROB, scope.calculated.LCRH - scope.calculated.UILAOT - scope.calculated.UILAOB);
        $log.info('Clear zone: ' + scope.calculated.CZW + ', ' + scope.calculated.CZH);
    }

    return {
        scope: {
            imgSrc: '@',
            zoomFactor: '@'
        },
        templateUrl: "templates/layer-image-template.html",
        restrict: 'E',
        link: link
    }
}])
;