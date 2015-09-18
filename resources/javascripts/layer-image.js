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
                Top: 15,
                Right: 12,
                Bottom: 10
            },
            Landscape: {
                Left: 0,
                Top: 30,
                Right: 20,
                Bottom: 20
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
            redZoneWidth: 0,
            redZoneHeight: 0,
            // Gray ZOne Size
            grayZoneWidth: 0,
            grayZoneHeight: 0,
            //borders for gray zone
            leftGrayBorder: 0,
            rightGrayBorder: 0,
            topGrayBorder: 0,
            bottomGrayBorder: 0
        };

        //selectors
        scope.layers = {
            glassLayer: element,
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
                $log.info('Image: (w: ' + scope.imageProps.originalWidth + ', h: ' + scope.imageProps.originalHeight + ', ap: ' + scope.imageProps.aspectRatio + ')');

                // max device aspect ratio
                scope.calculated.MAXDAR = scope.calculated.MAXDW / scope.calculated.MAXDH;
                $log.info('MAXDAR = ' + scope.calculated.MAXDAR);

                //fill preview props
                angular.extend(scope.previewProps, {
                    width: attrs.width,
                    height: attrs.width / scope.calculated.MAXDAR//scope.imageProps.aspectRatio, //PreviewHeight PH = PW / IAR
                });
                $log.info('Preview: (w: ' + scope.previewProps.width + ', h: ' + scope.previewProps.height + ', original height: ' + element.height() + ')');

                scope.calculated.PSCALE = scope.previewProps.width / scope.calculated.MAXDW;
                $log.info('PSCALE = ' + scope.calculated.PSCALE);
                //set preview size
                setElementSize(element, scope.previewProps.width, scope.previewProps.height);
                //recalculate zoomFactor
                calculateZoomFactor(scope);
                initImageZoom(scope);
                //calculate layers borders
                calculateLayers(scope);
                initRedZone(scope);
                initGrayZone(scope);
                initImageMove(scope);
            }
        );
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

    /**
     * Method calculate zoomFactor connected with settings and image original size
     * @param scope
     */
    function calculateZoomFactor(scope) {
        scope.calculated.zoomFactor = scope.previewProps.width / scope.imageProps.originalWidth;
        // MinZoomFactor (MINZF)
        scope.calculated.MINZF = Math.max(scope.calculated.MAXDW / scope.imageProps.originalWidth, scope.calculated.MAXDH / scope.imageProps.originalHeight);
        // MaxZoonFactor (MAXZF)
        scope.calculated.MAXZF = ( scope.calculated.MINZF >= 1 ? scope.calculated.MINZF : Math.min(scope.imageProps.originalWidth / scope.calculated.MAXDW, scope.imageProps.originalHeight / scope.calculated.MAXDW) );
        // note: MAXZF==MINZF means that no zooming is allowed
        scope.calculated.zoomFactor = (!scope.previewProps.zoomFactor || (scope.calculated.zoomFactor < scope.calculated.MAXZF && scope.calculated.zoomFactor >= scope.calculated.MINZF)) ? scope.calculated.zoomFactor : scope.calculated.MINZF;
        $log.info('MINZF = ' + scope.calculated.MINZF + ' , MAXZF = ' + scope.calculated.MAXZF + ' , zoomFactor = ' + scope.calculated.zoomFactor);
    }

    /**
     * Method zooming image depends on zoomFactor (precalculated)
     * @param scope
     */
    function initImageZoom(scope) {
        // ImageDivWidth (IDW)
        scope.imageProps.IDW = scope.imageProps.originalWidth * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        // ImageDivHeight (IDH)
        scope.imageProps.IDH = scope.imageProps.originalHeight * scope.calculated.zoomFactor * scope.calculated.PSCALE;
        $log.info('IDW = ' + scope.imageProps.IDW + ' , IDH = ' + scope.imageProps.IDH);
        scope.layers.imageLayer.css('width', scope.imageProps.IDW);
        scope.layers.imageLayer.css('height', scope.imageProps.IDH);
    }

    function initRedZone(scope) {
        //size
        setElementSize(scope.layers.redLayer, scope.previewProps.width, scope.previewProps.height);
        //borders
        setElementBorders(scope.layers.redLayer, scope.calculated.redZoneWidth, scope.calculated.redZoneWidth, scope.calculated.redZoneHeight, scope.calculated.redZoneHeight, 'rgba(217, 30, 24, 0.8)');
    }

    function initGrayZone(scope) {
        var delta = 2;
        //size
        setElementSize(scope.layers.grayLayer, scope.calculated.PCRW + delta, scope.calculated.LCRH + delta);
        //delta
        scope.layers.grayLayer.css('left', scope.calculated.redZoneWidth - delta / 2);
        scope.layers.grayLayer.css('top', scope.calculated.redZoneHeight - delta / 2);
        //borders
        setElementBorders(scope.layers.grayLayer, scope.calculated.leftGrayBorder, scope.calculated.rightGrayBorder, scope.calculated.topGrayBorder, scope.calculated.bottomGrayBorder, 'rgba(149, 165, 166, 0.7)');
    }

    function initImageMove(scope) {
        scope.layers.glassLayer.on('mousedown', function (event) {
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
            var endXImage = x + scope.imageProps.IDW;
            var endYImage = y + scope.imageProps.IDH;
            $log.info('image end x: ' + endXImage + ' , image end y : ' + endYImage);
            if (x < scope.calculated.redZoneWidth && y < scope.calculated.redZoneHeight &&
                endXImage > scope.previewProps.width - scope.calculated.redZoneWidth &&
                endYImage > scope.previewProps.height - scope.calculated.redZoneHeight) {
                $log.info(x + ' , ' + y);
                scope.moveProps.y = y;
                scope.moveProps.x = x;
                scope.layers.imageLayer.css({
                    top: y + 'px',
                    left: x + 'px'
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
        // UI Landscape Overlay Actual Px Offsets
        scope.calculated.UILAOL = scope.calculated.UILROL * scope.calculated.NLCRW;//TODO
        scope.calculated.UILAOT = scope.calculated.UILROT * scope.calculated.LCRH;
        scope.calculated.UILAOR = scope.calculated.UILROR * scope.calculated.NLCRW;//TODO
        scope.calculated.UILAOB = scope.calculated.UILROB * scope.calculated.LCRH;

        $log.info('PCRW: ' + scope.calculated.PCRW + ', LCRH: ' + scope.calculated.LCRH);
        // Clear Zone Size
        if ((scope.calculated.NLCRW - scope.calculated.UILAOL - scope.calculated.UILAOR) < (scope.calculated.PCRW - scope.calculated.UIPAOL - scope.calculated.UIPAOR)) {
            scope.calculated.cleanZoneWidth = (scope.calculated.NLCRW - scope.calculated.UILAOL - scope.calculated.UILAOR);
            scope.calculated.leftGrayBorder = scope.calculated.UILAOL;
            scope.calculated.rightGrayBorder = scope.calculated.UILAOR;
        } else {
            scope.calculated.cleanZoneWidth = (scope.calculated.PCRW - scope.calculated.UIPAOL - scope.calculated.UIPAOR);
            scope.calculated.leftGrayBorder = scope.calculated.UIPAOL;
            scope.calculated.rightGrayBorder = scope.calculated.UIPAOR;
        }
        if (scope.calculated.SPCRH - scope.calculated.UIPAOT - scope.calculated.UIPAOB < scope.calculated.LCRH - scope.calculated.UILAOT - scope.calculated.UILAOB) {
            scope.calculated.cleanZoneHeight = (scope.calculated.SPCRH - scope.calculated.UIPAOT - scope.calculated.UIPAOB);
            scope.calculated.topGrayBorder = scope.calculated.UIPAOT;
            scope.calculated.bottomGrayBorder = scope.calculated.UIPAOB;
        } else {
            scope.calculated.cleanZoneHeight = (scope.calculated.LCRH - scope.calculated.UILAOT - scope.calculated.UILAOB);
            scope.calculated.topGrayBorder = scope.calculated.UILAOT;
            scope.calculated.bottomGrayBorder = scope.calculated.UILAOB;
        }

        $log.info('Clear zone: ' + scope.calculated.cleanZoneWidth + ', ' + scope.calculated.cleanZoneHeight);
        // Red Zone Size
        scope.calculated.redZoneWidth = (scope.previewProps.width - scope.calculated.PCRW) / 2;
        scope.calculated.redZoneHeight = (scope.previewProps.height - scope.calculated.LCRH) / 2;
        $log.info('redZoneWidth = ' + scope.calculated.redZoneWidth + ' , redZoneHeight = ' + scope.calculated.redZoneHeight);
        // Gray Zone Size
        scope.calculated.grayZoneWidth = (scope.calculated.PCRW - scope.calculated.cleanZoneWidth) / 2;
        scope.calculated.grayZoneHeight = (scope.calculated.LCRH - scope.calculated.cleanZoneHeight) / 2;
        $log.info('grayZoneWidth = ' + scope.calculated.grayZoneWidth + ' , grayZoneHeight = ' + scope.calculated.grayZoneHeight);

        //only gray


    }

    return {
        scope: {
            imgSrc: '@'
        },
        templateUrl: "templates/layer-image-template.html",
        restrict: 'E',
        link: link
    }
}])
;