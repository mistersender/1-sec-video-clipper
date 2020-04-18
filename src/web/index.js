import './styles.styl'
import Vue from 'Vue'
import mainComponent from './components/main-component.vue'

let videoEl = document.getElementById('video')
let completedVideoEl = document.getElementById('current-completed-video')
let sliderEl = document.getElementById('sliderSelector')
let duration = 1
let startTime = 0
let timeout = null

const replaceVideo = function (currentVideoEl, srcPath){
  let newVideoEl = document.createElement('video')
  newVideoEl.setAttribute('controls', currentVideoEl.getAttribute('controls'))
  newVideoEl.setAttribute('width', currentVideoEl.getAttribute('width'))
  newVideoEl.setAttribute('id', currentVideoEl.getAttribute('id'))
  newVideoEl.innerHTML = `<source src="${srcPath}" type="video/mp4">`
  currentVideoEl.parentNode.replaceChild(newVideoEl, currentVideoEl)
  return newVideoEl
}

const exportable = {
  save() {
    let endTime = startTime + duration
    let clipName = videoEl.getElementsByTagName('source')[0].getAttribute('src').replace('/srcVideo/', '')
    fetch('/saveClip', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startTime,
        endTime,
        duration,
        clipName,
        dateInfo: {
          month: document.getElementById('saveMonth').value,
          day: document.getElementById('saveDay').value,
          year: document.getElementById('saveYear').value
        }
      })
    })
    .then(r => r.json())
    .then((r) => {
      var event = new CustomEvent('saveCompleted', { detail: r })
      document.dispatchEvent(event)
      exportable.showClippedVideo(r.clipLocation)
    })
    .catch(e => {
      console.error(e)
    })
  },
  play() {
    clearTimeout(timeout)
    videoEl.currentTime = startTime
    videoEl.play()
    timeout = setTimeout(() => videoEl.pause(), (duration * 1000))
  },
  changeDuration(changeTo){
    duration = changeTo
    const sliderSize = (duration / videoEl.duration)
    sliderEl.style.fontSize = (sliderSize * 600) + 'px'

    const max = videoEl.duration - duration
    if(startTime > max){
      startTime = max
    }
    sliderEl.setAttribute("max", (max * 100))
  },
  edit(clipName){
    videoEl = replaceVideo(videoEl, `/srcVideo/${clipName}`)
    videoEl.duration ? exportable.changeDuration(duration) : videoEl.addEventListener('loadedmetadata', () => exportable.changeDuration(duration))
  },
  showClippedVideo(clipLocation) {
    completedVideoEl.classList.remove('has-none')
    replaceVideo(completedVideoEl.getElementsByTagName('video')[0], clipLocation)
  }
}

sliderEl.addEventListener('change', function (e) {
  console.log('changed')
  startTime = (sliderEl.value / 100)
  exportable.play()
})

const router = new VueRouter({
  routes: [{
    path: "/:year/:month",
    component: mainComponent
  },
  {
    path: "/",
    component: mainComponent
  }]
})
const app = new Vue({
  router
}).$mount('#videoClipper')
// new Vue({
//   el: '#videoClipper',
//   components: {
//     'main-component': mainComponent
//   }
// })

export default exportable
