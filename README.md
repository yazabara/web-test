# *Image-cropper directive.* 

Demo: http://yazabara.github.io/web-test/

To use hust add directive element to page with required params (width, ui)

```
<layer-image
    data-width="300"
    data-ui="{{uiSetting}}">
</layer-image>
```
###*Params fro directive:*

Required params: UI and Width

#### ui*

UI overlays for two view types : portrait and landscape.
```
{"portrait":{"left":70,"right":0,"top":85,"bottom":110},
"landscape":{"left":75,"right":75,"top":75,"bottom":75}}
```

#### width*

Width of directive. height will calculate (depends on aspect ratio GLOBAL settings).

#### result-func 

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
*zoomFactor* - zoom in range [1, ...]. MaxZoom depends on image size.

*phoneCenter* - phone center relatively preview (directive view) in range[0,1].

*imageCenter* - preview(directive center) center relatively image in range[0,1].

*clearCenterShifts* - shifts relatively imageCenter in range [-0.5,+0.5]. 
Shifts depends on  phone position with yellow borders.



