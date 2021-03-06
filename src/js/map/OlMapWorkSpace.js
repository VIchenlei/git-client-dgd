import OlMapCardLayer from './OlMapCardLayer.js'
import OlMapReaderLayer from './OlMapReaderLayer.js'
import OlMapCameraLayer from './OlMapCameraLayer.js'
import OlMapTrackPlayer from './OlMapTrackPlayer.js'
import OlMapLandmarkLayer from './OlMapLandmarkLayer.js'
import OlMapFillAreaLayer from './OlMapFillAreaLayer'
import OlMapAreaLayer from './OlMapAreaLayer.js'
import OlMapAnimator from './OlMapAnimator.js'
import OlMapFaultLayer from './OlMapFaultLayer.js'
import OlMapMeasureLayer from './OlMapMeasureLayer.js'
import OlMapQueryLayer from './OlMapQueryLayer.js'
import OlMapLandmarkEdit from './OlMapLandmarkEdit.js'
import OlMapLayerEdit from './OlMapLayerEdit.js'
import OlMapLightLayer from './OlMapLightLayer.js'
import OlMapReaderEdit from './OlMapReaderEdit.js'
import OlMapReaderPathLayer from './OlMapReaderPathLayer.js'
import OlMapRoutePlan from './OlMapRoutePlan.js'
import OlMapFadeAreaLayer from './OlMapFadeAreaLayer.js'
import OlMapAntennaLayer from './OlMapAntennaLayer.js'

export default class OlmapWorkSpace {
  constructor (map, mapID, mapType) {
    this.map = map
    this.mapID = mapID
    this.mapType = mapType

    this.cardLayer = null
    this.readerLayer = null
    this.trackLayer = null
    this.draw = {interaction: 'yes'}
    this.animator = null
    this.init()
  }

  doHistoryAnimate (msg) {
    this.animator.animate(msg.msg, msg.x, msg.y, msg.duration)
  }

  doAnimate (msg) {
    let cardtype = msg.cardtype
    let duration = cardtype === 'staff' ? xdata.cardStore.averageUpdateDurationStaff * 0.99 : xdata.cardStore.averageUpdateDurationVehicle * 0.99 
    this.animator.animate(msg.msg, msg.x, msg.y, duration)
  }

  destroy () {
    this.areaLayer.unregisterGlobalEventHandlers()
    this.areaLayer = null
  }
  
  init () {
    switch (this.mapType) {
      case 'HISTORY':
        this.cardLayer = new OlMapCardLayer(this)
        this.trackLayer = new OlMapTrackPlayer(this)
        break
      default:
        console.warn('未知的 mapType : ', this.mapType)
        this.cardLayer = new OlMapCardLayer(this)
        this.readerLayer = new OlMapReaderLayer(this)
        this.cameraLayer = new OlMapCameraLayer(this)
        this.landmarkLayer = new OlMapLandmarkLayer(this)
        this.fillAreaLayer = new OlMapFillAreaLayer(this)
        this.areaLayer = new OlMapAreaLayer(this)
        this.faultLayer = new OlMapFaultLayer(this)
        this.measureLayer = new OlMapMeasureLayer(this)
        this.queryLayer = new OlMapQueryLayer(this)
        this.OlMapLandmarkEdit = new OlMapLandmarkEdit(this)
        this.OlMapLayerEdit = new OlMapLayerEdit(this)
        this.OlMapReaderEdit = new OlMapReaderEdit(this)
        this.OlMapReaderPathLayer = new OlMapReaderPathLayer(this)
        this.OlMapFadeAreaLayer = new OlMapFadeAreaLayer(this)
        this.animator = new OlMapAnimator(this.map)
        this.OlMapRoutePlan = new OlMapRoutePlan(this)
        this.OlMapLightLayer = new OlMapLightLayer(this)
        this.OlMapAntennaLayer = new OlMapAntennaLayer(this)
        break
    }
  }
}
