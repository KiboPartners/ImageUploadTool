
let fs = require('fs');
let mime = require('mime-types');
const Bottleneck = require("bottleneck");

const uploadDir = 'toUpload'
const filesDocumentList = "files@mozu";
let documentsResource = require('mozu-node-sdk/clients/content/documentlists/document')();


const limiter = new Bottleneck({
  maxConcurrent: 4,
});

let main = async function() {
    let files = fs.readdirSync(uploadDir).filter(f => f != "README");
                   
    await files.forEach(async file => {
      limiter.schedule(async ()=> {
        try { 
          let documents = await documentsResource.getDocuments({documentListName: filesDocumentList, filter: `name eq "${file}"`});
          if (documents.items.length == 0) {
            let extension = file.split('.').slice(-1)[0]
            let newDoc = await documentsResource.createDocument({documentListName: filesDocumentList}, {body: {
              "listFQN": filesDocumentList,
              "documentTypeFQN": "image@mozu",
              "extension": extension,
              "name": file,
            }});
            let newDocContent = await documentsResource.updateDocumentContent({
              documentListName: filesDocumentList, documentId: newDoc.id
            }, {
              body: fs.readFileSync(uploadDir+"/"+file),
              headers: { 'Content-Type': mime.contentType(extension) }
            });
            console.log(`Upload complete: ${file}`);
          } else {
            console.log(`File exists, skipping upload: ${file}`);
          }
        } catch(e) {
          console.error(e);
        }
      });
    });
                   
    await limiter.stop({
      dropWaitingJobs: false,
    });
};
          

main();
