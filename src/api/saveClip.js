
const { exec } = require('child_process')
const fs = require('fs')



const getDateInfo = function (rawDateInfo) {
  const year = rawDateInfo.year
  const month = ("0" + rawDateInfo.month).slice(-2) // ensure month is a string of always 2 numbers
  const day = ("0" + rawDateInfo.day).slice(-2) // ensure month is a string of always 2 numbers
  return { year, month, day, str: `${year}-${month}-${day}` }
}

module.exports = async function(req, res){
  let clip = req.body.clipName.replace('/srcVideo/', '')
  let srcVideo = `./srcVideo/${clip}`
  let dateInfo = getDateInfo(req.body.dateInfo)
  let destVideo = `./destVideo/${dateInfo.str}/clip.mp4`
  let type = req.body.clipName.indexOf('.mp4') != -1 ? 'video' : 'image'
  console.log('Requesting: ', clip, 'at:', req.body.startTime, 'for:', req.body.duration)
  try{ fs.unlinkSync(destVideo) } catch(e){} // dont care if this fails
  try { fs.mkdirSync(`./destVideo/${dateInfo.str}`, 0744) } catch (e) { } // dont care if this fails
  // first, copy over the screenshot
  // destination.txt will be created or overwritten by default.
  fs.copyFile(type == 'video' ? `./srcVideoScreenshot/${clip.replace('mp4', 'jpg')}` : `./srcVideo/${clip}`, `./destVideo/${dateInfo.str}/screenshot.jpg`, (err) => {
    if (err) return console.error(err)
    console.log('copied screenshot')
  });
  // then create the metadata
  let metadata = {
    is1SecOriginal: false,
    srcVideo: clip,
    startTime: req.body.startTime,
    duration: req.body.duration
  }
  fs.writeFile(`./destVideo/${dateInfo.str}/metadata.json`, JSON.stringify(metadata, null, 2), function (err) {
    if (err) return console.error(err)
    console.log('wrote metadata')
  });
  // last, cut the video
  console.log('building clip...')
  let ffmpegCommand = `ffmpeg -i ${srcVideo} -ss ${req.body.startTime} -t ${req.body.duration} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -s 1920x1080 ${destVideo} -loglevel error`
  if(type == 'image'){
    ffmpegCommand = `ffmpeg -loop 1 -i ${srcVideo} -t ${req.body.duration} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" ${destVideo} -loglevel error`
  }
  runCommand(ffmpegCommand)
    .then(({stdout, stderr}) => {
      if (stderr) {
        console.log('stdError: ', stderr)
        res.status(500)
        return res.send(JSON.stringify({status: 'error'}))
      }

      return res.send(JSON.stringify({ 
        status: 'ok',
        dateInfo,
        clipLocation: destVideo.slice(1, destVideo.length), // remove the "." at the beginning
        screenshotLocation: `./destVideo/${dateInfo.str}/screenshot.jpg`
      }))
    })
    .catch(e => {
      console.error(e)
      res.status(500)
      return res.send(JSON.stringify({ status: 'error' }))
    })
    .then(() => console.log("finished save"))
}


async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }

      resolve({
        stdout: stdout,
        stderr: stderr
      })
    })
  })
}