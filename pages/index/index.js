//index.js
//获取应用实例
const app = getApp()
const reqServer = 'https://www.microfun.top/wxUrlPlus'
const mta = require('../../utils/mta_analysis.js')

Page({
  data: {
    goAuthFlag: true,
    auditing: true,
    userInfo: {},
    saveAuthFlag: false,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    url: '',
    finishDecodeUrl: '',
    downloadUrl: '',
    errorUrl: ''
  },
  onReady: function(){
    wx.setNavigationBarTitle({
      title: 'URL+'
    })
  },
  onGotUserInfo: function(e) {
    console.log(e.detail.errMsg)
    console.log(e.detail.userInfo)
    console.log(e.detail.rawData)
  },
  textareaBind: function(e) {
    this.setData({
      url: e.detail.value
    })
  },
  saveVideoToLocal: function(){
    mta.Event.stat("save_video_btn",{})
    wx.showLoading({
      title: '保存中...',
    })
    wx.downloadFile({
      url: this.data.downloadUrl,
      success:function(res){
        console.log(res)
        let path = res.tempFilePath
        wx.hideLoading()
        wx.saveVideoToPhotosAlbum({
          filePath: path,
          success(res) {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail(res) {
            console.log('保存视频', res)
            wx.showToast({
              title: '保存失败，请重试',
              icon: 'none',
              duration: 2000
            })
          },
        })
      },fail:function(res){
        wx.hideLoading()
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none',
          duration: 2000
        })
        console.log(res)
      }
    })
  },
  clearUrl: function(){
    this.setData({
      url: '',
      finishDecodeUrl: ''
    })
  },
  changeUrl: function(e){
    // console.log()
    mta.Event.stat("chang_url_btn",{})
    // this.setData({
    //   userInfo: e.detail.userInfo,
    //   hasUserInfo: true
    // })
    let _that = this;
    if(_that.data.url){
      wx.showLoading({
        title: '加载中...',
      })
      _that.setData({
        errorUrl: '',
        finishDecodeUrl: ''
      })
      let urlString = _that.data.url
      if (e.target.dataset.taptype === 'china') {
        const regChina = /[\u4e00-\u9fa5]/g
        const regJing = /#/g
        const regDou = /，/g
        const regAt = /@/g
        urlString = _that.data.url.replace(regChina, "").replace(regJing, "").replace(regDou, "").replace(regAt, "")
      }
      wx.request({
        url: reqServer + '/douyin',
        header: {
            'content-type': 'application/json'
        },
        method: 'POST',
        data: {
          url: urlString
        },
        success: function(res) {
          wx.hideLoading()
          wx.showToast({
            title: '转换成功',
            icon: 'success',
            duration: 2000
          })
          // console.log(res)
          if(res){
            if(res.data){
              const curDownloadUrl = 'https://www.microfun.top/wxUrlPlus' + res.data.curVideo
              _that.setData({
                finishDecodeUrl: res.data.video,
                downloadUrl: curDownloadUrl
              })
            }else{
              _that.setData({
                errorUrl: _that.data.url
              })
            }
          }
        },
        fail: function(res) {
          wx.hideLoading()
          console.log('转换失败', res);
          wx.showToast({
            title: '转换失败，请重试',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }else{
      wx.showToast({
        title: '请输入链接',
        icon: 'none',
        duration: 2000
      })
    }
    
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onShow: function(){
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          app.globalData.saveAuthFlag = true
          this.setData({
            saveAuthFlag: true
          })
        }
      }
    })
    
  },
  onLoad: function () {
    mta.Page.init({
      "appID":"500616126",
      "eventID":"500616127",
    })
    Promise.all([app.getAuthKey(), this.getAuditing()]).then((result) => {
      console.log(app.globalData.saveAuthFlag)
      this.setData({
        saveAuthFlag: app.globalData.saveAuthFlag
      })
    })
    
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  goAuthAlbum: function(e) {
      wx.authorize({
        scope:'scope.writePhotosAlbum',
        success: res =>{
          this.setData({
            saveAuthFlag: true
          })
          app.globalData.saveAuthFlag = true
        },
        fail: res =>{
          this.setData({
            goAuthFlag: false
          })
        },
    })
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  getAuditing: function(e) {
    wx.request({
      url: reqServer + '/douyin/auditing',
      method: 'GET',
      success: (res) => {
        this.setData({
          auditing: res.data.data
        })
      },
      fail: function(res) {
        console.log('auditing失败', res);
      }
    })
    
  },
  onShareAppMessage: function (res) {
    return {
      title: 'URL+,复制黏贴，给你一个无滤镜的世界',
      imageUrl: 'https://www.microfun.top/assets/share.jpg',
      path: 'pages/index/index'
    }
  }
})
