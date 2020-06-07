const express = require('express');
const serveStatic = require('serve-static')
const saveClip = require('./src/api/saveClip')
const getClips = require('./src/api/getClips')
const bodyParser = require('body-parser');
const app = express();
const mkdirp = require('mkdirp')

// Ensure required folders exist
mkdirp('./1-sec-originals')
mkdirp('./srcVideo')
mkdirp('./srcVideoScreenshot')
mkdirp('./destVideo')

app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
app.post('/saveClip', saveClip);
app.get('/clips', getClips);

app.use('/', serveStatic('./src/web/'))
app.use('/dist/', serveStatic('./dist/'))
app.use('/srcVideo/', serveStatic('./srcVideo/'))
app.use('/destVideo/', serveStatic('./destVideo/'))
app.use('/srcVideoScreenshot/', serveStatic('./srcVideoScreenshot/'))
app.listen(8080);