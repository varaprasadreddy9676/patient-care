// const fs = require('fs')
// const uuid = require('uuid/v4')
// const pdfjsLib = require('pdfjs-dist/build/pdf')
// const NodeCanvasFactory = require('./nodeCanvas')

// module.exports.generatePDFThumbnail = async function (b64) {
//   return new Promise((resolve, reject) => {

// // Relative path of the PDF file.
// // const pdfURL = './sample.pdf'

// // Read the PDF file into a typed array so PDF.js can load it.
// // const source = new Uint8Array(fs.readFileSync(pdfURL));

// const source = new Uint8Array (Buffer.from(b64.toString('utf-8'), 'base64'))
// // fs.writeFile('result_buffer.pdf', source, error => {
// //   if (error) {
// //       throw error;
// //   } else {
// //       console.log('buffer saved!');
// //   }
// // });


// // Load the PDF file.
// const loadingTask = pdfjsLib.getDocument(source)

// loadingTask.promise
//   .then(function(pdfDocument) {
//     console.log('# PDF document loaded.')

//     // Get the first page.
//     pdfDocument.getPage(1).then(function(page) {

//       // Render the page on a Node canvas with 100% scale.
//       const viewport = page.getViewport({ scale: 1.0 })
//       const canvasFactory = new NodeCanvasFactory()
//       const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
//       const renderContext = {
//         canvasContext: canvasAndContext.context,
//         viewport: viewport,
//         canvasFactory: canvasFactory,
//       }

//       const renderTask = page.render(renderContext)
//       renderTask.promise.then(function() {
//         // Convert the canvas to an image buffer.
//         const image = canvasAndContext.canvas.toBuffer()
//         let string64 = image.toString('base64');
//         console.log(string64);
//         resolve(string64);
//         // fs.writeFile(`./thumbs/${uuid()}.png`, image, function (error) {
//         //   if (error) {
//         //     console.error('Error: ' + error)
//         //   } else {
//         //     console.log('Finished converting first page of PDF file to a PNG image.')
//         //   }
//         // })
//       })
//     })
//   })
//   .catch(function(reason) {
//     console.log(reason);
//     reject(reason)
//   })
// })
// }


