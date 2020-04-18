
const { exec } = require('child_process')
const fs = require('fs')

const getDateInfo = function (fileName) {
  const year = fileName.slice(0, 4)
  const rawMonth = parseInt(fileName.slice(4, 6)) + 1 // month starts with january at 0
  const month = ("0" + rawMonth).slice(-2) // ensure month is a string of always 2 numbers
  const day = fileName.slice(6, 8)
  return { year, month, day, str: `${year}-${month}-${day}` }
}


const getClips = async function (req, res) {
  return new Promise(res => {
    fs.readdir('./1-sec-originals', async function (err, items) {
      let fullVideos = items.map(item => {
        let dateInfo = getDateInfo(item)
        if(isNaN(dateInfo.month)){
          return
        }
        // make sure video exists. if it doesn't return nothing.
        try{
          fs.statSync(`./1-sec-originals/${item}/clip.mp4`);
        }catch(e){
          console.log("no video for file:", `./1-sec-originals/${item}/clip.mp4`)
          return
        }
        return {
          videoLocation: `./1-sec-originals/${item}/clip.mp4`,
          dateInfo: getDateInfo(item),
          screenshotLocation: `./1-sec-originals/${item}/thumb.jpg`
        }
      })

      return res(fullVideos)
    })
  })
}


const moveClip = async function (videoMeta) {
  let srcVideo = videoMeta.videoLocation
  let dateInfo = videoMeta.dateInfo
  let destVideo = `./destVideo/${dateInfo.str}/clip.mp4`
  try { fs.unlinkSync(destVideo) } catch (e) { } // dont care if this fails
  try { fs.mkdirSync(`./destVideo/${dateInfo.str}`, 0744) } catch (e) { } // dont care if this fails
  // first, copy over the screenshot
  // destination.txt will be created or overwritten by default.
  fs.copyFile(videoMeta.screenshotLocation, `./destVideo/${dateInfo.str}/screenshot.jpg`, (err) => {
    if (err) return console.error(err)
  });
  // now move the video
  fs.copyFile(videoMeta.videoLocation, destVideo, (err) => {
    if (err) return console.error(err)
  });
  // then create the metadata
  let metadata = {
    is1SecOriginal: true,
    srcVideo: srcVideo,
    startTime: null,
    duration: null
  }
  fs.writeFile(`./destVideo/${dateInfo.str}/metadata.json`, JSON.stringify(metadata, null, 2), function (err) {
    if (err) return console.error(err)
  });
}

getClips().then(clipInfo => {
  clipInfo.forEach(clip => clip && moveClip(clip))
})