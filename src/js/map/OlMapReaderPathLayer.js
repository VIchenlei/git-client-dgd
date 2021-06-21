import ol from 'openlayers'
import { getMessage, getRows, composeUpdateDBReq, metaUpdateRes } from '../utils/utils'
import { initInteractions, drawOLLine, getPolylineBYPoints, drawSymbol } from './OlMapUtils'
import '../../tags/rs-merge-dialog/tags/rs-merge-dialog.html'
export default class OlMapReaderPathLayer{
  constructor (glayer) {
    this.map = glayer.map
    this.draw = null
    this.modify = null
    this.snap = null
    this.source = null
    this.tool = null
    let self = this
    this.coords = null
    this.pathLayer = false // 是否处于编辑交点状态
    this.initReaderLayer()

    //点击实时界面左侧分站列表操作按钮 显示隐藏分站路径 
    xbus.on('MAP-SHOW-READERPATH', (msg) => {
      this.draw = this.map.draw
      this.showHidePaths(msg)
    })

    // 绘制、删除相交点
    xbus.on('MAP-DRAW-POINT', (msg) => {
      const { status, name } = msg
      if (status) {
        if (!this.pathLayer) {
          this.showHidePaths({checked: status})
          this.showPoints()
        }

        if (name === 'edit_point' && !this.draw) {
          this.addInteraction()
          this.obtainDrawend()
        } else {
          this.removeInteraction()
          this.registerEventHandler()
        }
        this.pathLayer = true
      } else if (!status) {
        this.showHidePaths({checked: status})
        this.removeInteraction()
        this.pathLayer = false
      }
    })
  }

  initReaderLayer () {
    this.modifyArr = []
    let self = this
    this.pathSelect = new ol.interaction.Select()
    this.pathModify = new ol.interaction.Modify({
        features: this.pathSelect.getFeatures()
    })
    this.pathSelect.setActive(false)
    this.pathModify.setActive(false)
    this.layerSource = new ol.source.Vector()
    this.readerLayer = new ol.layer.Vector({
      source: this.layerSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255,255,255,0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#FF6057',
          width: 2
        })
      })
    })

    this.map.addLayer(this.readerLayer)

    this.pathModify.on('modifyend', (e)=> {
      this.modifyArr.push(e.features.getArray()[0])
    })

    this.map.addEventListener('dblclick', function (e) {
      xbus.trigger('CHANGE-SWITCH-PANEL', {isEdit: false})
      let isSelect = self.pathSelect.getActive()
      if (!isSelect) return
      let features = self.layerSource.getFeatures()
      let dealPathDatas = []
      for(let i = 0; i < features.length; i++) {
          let coordinates = features[i].getGeometry().getCoordinates()
          dealPathDatas.push(coordinates)
      }
      self.coords = dealPathDatas
      let pathMsg = self.getReaderPathMsg()
      xbus.trigger('SHOW-READEDIALOG',{ thirdMsg: pathMsg })
      self.clearlayerSource()
    })
  }

  registerGlobalEventHandlers () {
    xbus.on('META-UPDATE-DB-RES', res => {
      if (res.data.name === 'intersection_point') {
        metaUpdateRes(res, 'intersection_point', this.cmd)
        if (res.code === 0) {
          this.cmd === 'INSERT' ? this.drawPoint(this.point) : this.deletePoint(this.point)
        }
      }
    })
  }

  allowModify () {
    this.pathSelect.setActive(true)
    this.pathModify.setActive(true)
    this.map.addInteraction(this.pathSelect)
    this.map.addInteraction(this.pathModify)
    xbus.trigger('CHANGE-SWITCH-PANEL', {isEdit: true})
    this.layerSource.clear()
  }

  clearlayerSource () {
    this.layerSource.clear()
    for (let i = 0, len = this.modifyArr.length; i < len; i++) {
        if (this.modifyArr[i]) this.modifyArr[i].setGeometry(null)
    }
    this.pathSelect.setActive(false)
    this.pathModify.setActive(false)
    this.map.removeInteraction(this.pathSelect)
    this.map.removeInteraction(this.pathModify)
  }

  //获取分站路径信息
  getReaderPathMsg () {
    let coords = this.coords
    let readerPathMsg = this.thirdMsg
    for (let i = 0; i < readerPathMsg.length; i++) {
      const { rows } = readerPathMsg[i]
      readerPathMsg[i].cmd = 'INSERT'
      for (let j = 0; j < rows.length; j++) {
        let row = rows[j]
        if (row.field_name === 'b_x') {
          row.field_value = Number(coords[i][0][0].toFixed(2))
        }
        if (row.field_name === 'b_y') {
          row.field_value = -Number(coords[i][0][1].toFixed(2))
        }
        if (row.field_name === 'e_x') {
          row.field_value = Number(coords[i][1][0].toFixed(2))
        }
        if (row.field_name === 'e_y') {
          row.field_value = -Number(coords[i][1][1].toFixed(2))
        }
      }
    }
    return readerPathMsg
  }

  createPathStyle (color) {
    const style = {
      stroke: { width: 4, color: color },
      fill: { color: 'rgba(255,255,255,0.2)'},
    }
    return new ol.style.Style({
      stroke: new ol.style.Stroke(style.stroke),
      fill: new ol.style.Fill(style.fill)
    })
  }

  drawOLLine (layerSource, point, name, color) {
    const linestring = new ol.geom.LineString(point) // 坐标数组
    const lineLength = linestring.getLength()
    var lineFeature = new ol.Feature({
      geometry: linestring,
      id: name,
      finished: false
    })
    lineFeature.setStyle(this.createPathStyle(color))
    layerSource.addFeature(lineFeature)
    return { lineFeature, lineLength }
  }

  getPathArray (data, msg) {
    let pathArray = []
    let b_x = null, b_y = null, e_x = null, e_y = null
    let isInsert = false
    if (msg.rows) {
      b_x = data.rows.filter(item => item.field_name === 'b_x')[0].field_value
      b_y = data.rows.filter(item => item.field_name === 'b_y')[0].field_value
      e_x = data.rows.filter(item => item.field_name === 'e_x')[0].field_value
      e_y = data.rows.filter(item => item.field_name === 'e_y')[0].field_value
      isInsert = data.cmd === 'INSERT'
    } else {
      b_x = data.b_x
      b_y = data.b_y
      e_x = data.e_x
      e_y = data.e_y
    }
    pathArray.push([b_x, isInsert ? Number(b_y) : -Number(b_y)])
    pathArray.push([e_x, isInsert ? Number(e_y) : -Number(e_y)])

    return pathArray
  }

  showHidePaths (msg) {
    const keyValue = Number(msg.name)
    if (msg.checked || msg.isVisible) {
      if (msg.isModify && keyValue) this.allowModify()
      const reaerPaths = xdata.metaStore.data.reader_path_tof_n && Array.from(xdata.metaStore.data.reader_path_tof_n.values())
      let message = keyValue ? reaerPaths.filter(item => item.reader_id === keyValue) : reaerPaths
      if (msg.rows) { //新增、编辑状态下点击跳转图标修改分站路径
        this.thirdMsg = msg.rows
        message = msg.rows
      }
      const pathColor = keyValue ? ['#FFAA03', '#0AB300', '#0000CD', '#7CFC00', '#8A2BE2'] : ['#FFCC33']
      if (message.length > 0) {
        for (let i = 0; i < message.length; i++) {
          const color = keyValue ? pathColor[i] : pathColor[0]
          const pathArray = this.getPathArray(message[i], msg)
          this.drawOLLine(this.layerSource, pathArray, keyValue, color)
        }
      } else if (keyValue) {
        const msg = {
          type: 'warning',
          message: '该分站没有配置路径'
        }
        window.xMessage.open(msg)
      }
    } else {
      if (!keyValue) return this.layerSource.clear() // 隐藏全部分站路径

      const features = this.layerSource.getFeatures()
      for (let feature of features) {
        const id = feature.getProperties().id
        if (id == keyValue) this.layerSource.removeFeature(feature)
      } 
    }
  }

  drawPoint (msg) {
    let point = msg.split(',')
    let feature = new ol.Feature(new ol.geom.Point([Number(point[0]), -Number(point[1])]))
    feature.setStyle(new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: '#ff00b1',
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: '#ff00b1'
        })
      })
    }))
    feature.setProperties({
      point: msg,
      type: 'intersection_point'
    })
    this.layerSource.addFeature(feature)
  }

  showPoints () {
    const self = this
    const points = xdata.metaStore.data.intersection_point && Array.from(xdata.metaStore.data.intersection_point.values())
    points && points.forEach(item => {
      const { point } = item
      self.drawPoint(point)
    })
  }

  removeInteraction () {
    this.map.removeInteraction(this.draw)
    this.map.removeInteraction(this.snap)
    this.draw = null
    this.snap = null
  }

  addInteraction () {
    const source = this.layerSource
    this.draw = new ol.interaction.Draw({
      source: source,
      type: 'Point',
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          })
        })
      })
    })
    this.map.addInteraction(this.draw)

    this.snap = new ol.interaction.Snap({
      source: source,
      pixelTolerance: 20
    })
    this.map.addInteraction(this.snap)
  }

  registerEventHandler () {
    if (!this.map) return

    this.map.addEventListener('click', evt => {
      let feature = this.map.forEachFeatureAtPixel(evt.pixel, (feature) => feature)
      if (feature && feature.getProperties().type === 'intersection_point') {
        const { point } = feature.getProperties()
        this.point = point
        this.cmd = 'DELETE'
        let sql = `DELETE FROM dat_intersection_point where point = '${point}'`
        const req = composeUpdateDBReq(this.cmd, 'intersection_point', 1, sql)
        xbus.trigger('META-UPDATE-DB', {
          req: req
        })
        this.registerGlobalEventHandlers()
      }
    })
  }

  obtainDrawend () {
    if (this.draw instanceof String) return
    this.draw.on('drawend', evt => {
      const coordinates = evt.feature.getGeometry().getCoordinates()
      const px = coordinates[0]
      const py = -coordinates[1]
      const readerPaths = xdata.metaStore.data.reader_path_tof_n && Array.from(xdata.metaStore.data.reader_path_tof_n.values())
      const paths = readerPaths && readerPaths.filter(path => {
        const { b_x, b_y, e_x, e_y } = path
        const olineLength = Math.sqrt(Math.pow((e_x - b_x), 2) + Math.pow((e_y - b_y), 2))
        const clineLength = Math.sqrt(Math.pow((px - e_x), 2) + Math.pow((py - e_y), 2)) + Math.sqrt(Math.pow((b_x - px), 2) + Math.pow((b_y - py), 2))
        
        if (Math.abs(olineLength - clineLength) <= 0.03) return true
      })
      if (paths.length >= 2) {
        const point = `${px.toFixed(1)},${py.toFixed(1)}`
        this.point = point
        this.cmd = 'INSERT'
        const sql = `REPLACE INTO dat_intersection_point (point) VALUES('${point}')`
        const req = composeUpdateDBReq(this.cmd, 'intersection_point', 1, sql)
        xbus.trigger('META-UPDATE-DB', {
          req: req
        })
        this.registerGlobalEventHandlers()
      }
    })
  }

  deletePoint (msg) {
    const features = this.layerSource.getFeatures()
    const feature = features.filter(feature => {
      const properties = feature.getProperties()
      const { type, point } = properties
      if (type === 'intersection_point' && point === msg) return true
      return false
    })
    feature[0] && this.layerSource.removeFeature(feature[0])
  }
}