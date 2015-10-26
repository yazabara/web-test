# *Image-cropper directive.* 

Demo: http://yazabara.github.io/web-test/

To use hust add directive element to page with required params (width, ui)
```
<layer-image
    data-width="300"
    data-ui="{{uiSetting}}">
</layer-image>
```
*Params fro directive:*

*ui* - (required) ui overlays for two view types : portrait and landscape
```
{"portrait":{"left":70,"right":0,"top":85,"bottom":110},
"landscape":{"left":75,"right":75,"top":75,"bottom":75}}
```

*width* - (required) width of directive. height will calculate (depends on aspect ratio GLOBAL settings).

*result-func* - result callback with one argument.
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




