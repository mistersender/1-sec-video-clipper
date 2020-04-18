
const { exec } = require('child_process')
const fs = require('fs')

const getDateInfo = function(fileName){
  try{
    let [type, date] = fileName.split('_')
    if (type == "VID" || type == "IMG"){
      let year = date.slice(0, 4)
      let month = date.slice(4, 6)
      let day = date.slice(6, 8)
      return { year, month, day }
    }
  }
  catch(e){
    console.log("could not get date from video name, falling back to stats.")
  }

  let stats = fs.statSync('./srcVideo/' + fileName);
  // convert to string like 2020-03-22T12:22:27Z, then get the first half, and split on date
  let [year, month, day] = stats.birthtime.toISOString().split('T')[0].split('-')
  return { year, month, day }
}

const getDestVideos = function(){
  return new Promise((resolve, reject) => {
    fs.readdir('./destVideo', (err, filenames) => err ? reject(err) : resolve(filenames))
  })
}
const getScreenshots = function () {
  return new Promise((resolve, reject) => {
    fs.readdir('./srcVideoScreenshot', (err, filenames) => err ? reject(err) : resolve(filenames))
  })
}

const sortVideos = async function (rawVideos){
  let sortedVideos = {}
  for(let video of rawVideos){
    if(!sortedVideos[video.dateInfo.year]){
      sortedVideos[video.dateInfo.year] = {}
    }
    if(!sortedVideos[video.dateInfo.year][video.dateInfo.month]){
      sortedVideos[video.dateInfo.year][video.dateInfo.month] = {}
    }
    if(!sortedVideos[video.dateInfo.year][video.dateInfo.month][video.dateInfo.day]){
      sortedVideos[video.dateInfo.year][video.dateInfo.month][video.dateInfo.day] = {
        isComplete: false,
        selectedVideo: {},
        options: []
      }
    }
    sortedVideos[video.dateInfo.year][video.dateInfo.month][video.dateInfo.day].options.push(video)
  }
  // sorted videos will be transformed here
  await addSelectedClips(sortedVideos)

  // remove dotfiles (eg .DS_Store)
  for(let key of Object.keys(sortedVideos)){
    if(isNaN(key)){
      delete sortedVideos[key]
    }
  }

  return sortedVideos
}

const addSelectedClips = async function(sortedVideos){
  let destVideos = await getDestVideos()
  destVideos.forEach(filename => {
    let [year, month, day] = filename.split('-')
    // ensure y/m/d exist
    if (!sortedVideos[year]) {
      sortedVideos[year] = {}
    }
    if (!sortedVideos[year][month]) {
      sortedVideos[year][month] = {}
    }
    if (!sortedVideos[year][month][day]) {
      sortedVideos[year][month][day] = {
        isComplete: false,
        selectedVideo: {},
        options: []
      }
    }
    // add data to the y/m/d in question
    sortedVideos[year][month][day].isComplete = true
    sortedVideos[year][month][day].selectedVideo = {
      clipLocation: `/destVideo/${filename}/clip.mp4`,
      dateInfo: { year, month, day },
      screenshotLocation: `/destVideo/${filename}/screenshot.jpg`,
    }
  })
}

module.exports = async function (req, res) {
  let screenshots = await getScreenshots()
  fs.readdir('./srcVideo', async function (err, items) {
    let fullVideos = items.map(item => {
      let type = item.indexOf('.mp4') != -1 ? 'video' : 'image'
      hasScreenshot = screenshots.includes(item.replace('mp4', 'jpg'))
      if(!hasScreenshot && type == 'video'){
        runCommand(`ffmpeg -ss 0 -i ./srcVideo/${item} -frames:v 1 -t 1 -s 480x300 -f image2  -loglevel error ./srcVideoScreenshot/${item.replace('mp4', 'jpg')}`)
      }
      let dateInfo = getDateInfo(item)
      return {
        videoLocation: item,
        type,
        dateInfo,
        screenshotLocation: type == 'video' ? `/srcVideoScreenshot/${item.replace('mp4', 'jpg')}` : `/srcVideo/${item}`
      }
    })

    let sortedVideos = await sortVideos(fullVideos)

    return res.send(JSON.stringify({ status: 'ok', items: sortedVideos }))
  });
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