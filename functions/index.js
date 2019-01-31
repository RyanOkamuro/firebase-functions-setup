const functions = require('firebase-functions')
const os = require('os')
const path = require('path')
const cors = require('cors')({ origin: true })
const Busboy = require('busboy')
const fs = require('fs')


const projectId = "fileuploaderryanokamuro";
const keyfilename = "fileuploaderryanokamuro-firebase-adminsdk-8q016-a3fb7bf550.json"

//need to pass in key
const {
    Storage
} = require("@google-cloud/storage");

const gcs = new Storage ({
    projectId: projectId,
    keyfilename: keyfilename
})

exports.uploadFile = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== 'POST') {
      return res.status(500).json({
        message: 'Not allowed',
      })
    }
    const busboy = new Busboy({ headers: req.headers })
    let uploadData = null

    //triggers when file is found by busboy
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      //incoming file will be stored in temp file and will extract that temp file
      const filepath = path.join(os.tmpdir(), filename)
      uploadData = { file: filepath, type: mimetype }
      //write file to the system
      file.pipe(fs.createWriteStream(filepath))
    })

    //once busboy finishes parsing request will upload data
    busboy.on('finish', () => {
      const bucket = gcs.bucket('fileuploaderryanokamuro.appspot.com')
      bucket
        .upload(uploadData.file, {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: uploadData.type,
            },
          },
        })
        .then(() => {
          return res.status(200).json({
            message: 'Successful upload',
          })
        })
        .catch(err => {
          return res.status(500).json({
            error: err,
          })
        })
    })
    busboy.end(req.rawBody)
  })
})