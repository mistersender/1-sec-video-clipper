
const { exec } = require('child_process')
const fs = require('fs')

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


const getClips = async function (req, res) {
  return new Promise(res => {
    fs.readdir('../../destVideo', async function (err, items) {
      let videosWithIssues = []
      for(let i in items) {
        let item=items[i]
        let clip = `../../destVideo/${item}/clip.mp4`
        // make sure video exists. if it doesn't return nothing.
        try {
          fs.statSync(clip);
        } catch (e) {
          console.log("no video for file:", clip)
          return
        }
        
        let { stdout, stderr } = await runCommand(`ffprobe -i ${clip} -show_format -v quiet | sed -n 's/duration=//p' `).catch(e => console.error(e))
        let timelength = stdout.replace('\n', '')
        if (timelength < 0.9){
          let metadata = JSON.parse(fs.readFileSync(`../../destVideo/${item}/metadata.json`, 'utf-8'))
          metadata.timelength = timelength
          metadata.date = item
          videosWithIssues.push(metadata)
          console.log(timelength, clip)
        }
      }

      return res(videosWithIssues)
    })
  })
}


getClips().then(clipInfo => {
  fs.writeFileSync('./bork-clips.json', JSON.stringify(clipInfo, null, 2))
  console.log('done.')
})

