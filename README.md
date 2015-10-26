# *Image-cropper directive.* 

Demo: http://yazabara.github.io/web-test/

To use hust add directive element to page with required params (width, ui)

There are 3 wa y to use it:

- default way *( default position - center )* :
```
<layer-image
    data-width="300"
    data-ui="{{uiSetting}}"
    data-result-func="resultCallback(imageLayerResult)">
</layer-image>
```
- directive with face *( face will be on phone display in clear zone with calculated zoom )*:
```
<layer-image
    data-width="300"
    data-ui="{{uiSetting}}"
    data-face="{{face}}"
    data-result-func="resultCallback(imageLayerResult)">
</layer-image>
```
- directive with existing params *( directive use input params )*:
```
<layer-image
    data-width="300"
    data-ui="{{uiSetting}}"
    data-image-center="{{imgExist.imageCenter}}"
    data-clear-shift="{{imgExist.clearShift}}"
    data-zoom-factor="{{imgExist.zoomFactor}}"
    data-result-func="resultCallback(imageLayerResult)">
</layer-image>
```


###*Params for directive:*

Required params: UI and Width

#### UI

```
<layer-image data-ui="{{uiSetting}}" ...
```

UI overlays for two view types : portrait and landscape.
```
{"portrait":{"left":70,"right":0,"top":85,"bottom":110},
"landscape":{"left":75,"right":75,"top":75,"bottom":75}}
```

#### Width

```
<layer-image data-width="500" ...
```

Width of directive. height will calculate (depends on aspect ratio GLOBAL settings).

#### Result-func 

```
<layer-image data-result-func="resultCallback(imageLayerResult)" ...
```

Result callback with one argument. Argument looks like:

```
{
    zoomFactor: zoomFactor,
    phoneCenter: {
      x: phoneCenterX,
      y: phoneCenterY
    },
    clearCenterShifts: {
      shiftX: clearZoneShiftX,
      shiftY: clearZoneShiftY
    },
    imageCenter: {
      x: imageCenterX,
      y: imageCenteY
    }
}
```
**zoomFactor** - zoom in range [1, ...]. MaxZoom depends on image size.

**phoneCenter** - phone center relatively preview (directive view) in range[0,1].

**imageCenter** - preview(directive center) center relatively image in range[0,1].

**clearCenterShifts** - shifts relatively imageCenter in range [-0.5,+0.5]. 
Shifts depends on  phone position with yellow borders.

#### Face

```
<layer-image data-face="{{face}}"...
```

Face rectangle:
```
{
    "faceCenterX": 0.44,
    "faceCenterY": 0.19,
    "faceWidth": 0.1,
    "faceHeight": 0.1
}
```
All props must be in range [0,1]

####Image center

```
<layer-image data-image-center="{{imgExist.imageCenter}}" ...
```

Preview position relatively image. Must be in range [0,1] For example center will be :
```
{
    centerX: 0.5,
    centerY: 0.5
}
```
####Zoom factor

```
<layer-image data-zoom-factor="1.5" ...
```

Zoom property must be in range [1, ...]. MaxZoom depends on image size.

####Clear zone shifts

```
<layer-image data-clear-shift="{{imgExist.clearShift}}" ...
```

Shifts relatively imageCenter in range [-0.5,+0.5]. Shifts depends on  phone position with yellow borders.

![Alt text](/../gh-pages/resources/images/github/clear-zone.png?raw=true "Clear zone")
![Alt text](/../gh-pages/resources/images/github/clear-zone-center.png?raw=true "Clear zone center with shifts")


