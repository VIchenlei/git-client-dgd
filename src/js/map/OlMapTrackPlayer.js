// import TWEEN from 'tween.js'
import OlMapTrackLayer from './OlMapTrackLayer.js'
import { getPolylineBYPoints, drawOLLine } from './OlMapUtils.js'
import ol from 'openlayers'
export default class OlMapTrackPlayer extends OlMapTrackLayer {
  constructor (workspace) {
    super(workspace)
    this.map = workspace.map
    this.trackWhole = null
    this.layerSource = new ol.source.Vector()
    this.trackPlayerLayer = new ol.layer.Vector({source: this.layerSource})
    this.trackPlayerLayer.name = 'trackplayerlayer'
    this.map.addLayer(this.trackPlayerLayer)
  }

  drawWholeTrack (msg, PatrolPath) {
    let cardID = msg.cardID
    this.data = msg.rows
    let data = this.data
    let track = this.drawOLTrack(cardID, data, 'track-whole', PatrolPath)

    this.trackWhole = { cardID: cardID, pathDef: track.pathDef, pathDom: track.pathDom, pathLength: track.pathLength }
  }

  drawOLTrack (cardID, data, className, PatrolPath) {
    let track = null
    let path = getPolylineBYPoints(data)
    if (path.hopCount > 0) {
      let id = `HISTORY_TRACK_${cardID}`
      track = drawOLLine(this.layerSource, id, path.pointCol, className, PatrolPath)
    }
    return { pathDom: track.lineFeature, pathLength: track.lineLength, pathDef: path }
  }
}
