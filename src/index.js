const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

const isImgLink = (url) => {
    if (typeof url !== 'string') {
      return false;
    }
    return (url.match(/^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gmi) !== null);
}

let urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
function linkify(text) {
    const links = text.match(urlRegex);
    if(links === null) {
        return [];
    }
    const result = [];
    links.forEach(link => {
        if(isImgLink(link)) {
            result.push(link);
        }
    })
    return result;
}

const findImg = (data) => {
    let result = [];
    const keys = Object.keys(data);
    keys.forEach(key => {
        if(key === 'image'){
            if(data[key].startsWith('http')){
                result.push(data[key])
            }
        }else{
            if(linkify(JSON.stringify(data[key])).length !== 0){
                result = [...result, ...linkify(JSON.stringify(data[key]))];
            }
        }

    })
    return result;
}
let anh = 0;
const saveImg = (url, filename) => {
    console.log(url)
    const file = fs.createWriteStream(filename);
    const request = http.get(url, function(response) {
       response.pipe(file);
        anh++
       // after download completed close filestream
       file.on("finish", () => {
           file.close();
       });
    });
}


let db = new sqlite3.Database(path.resolve (__dirname, 'new_data.db'), sqlite3.OPEN_READONLY, (err) => { 
    if (err) { 
        console.log('Error when creating the database', err) 
    } else {
        console.log('Database connect successfully')
    } 
})

db.all("SELECT * FROM Card", [], function(err, rows) {
    if(err) { 
        console.log('Error when get data');
    }
    console.log('alo')
    rows.forEach(row => {
        const imgs1 = findImg(JSON.parse(row.question));
        const imgs2 = findImg(JSON.parse(row.answer));
        const data = [...imgs1, ...imgs2];
        if(data.length > 0){
            data.forEach(item => {
                let url = item;
                const arr = item.split('/');
                let name = arr[arr.length - 1];
                if(name.includes('?')) {
                    const arr1 = name.split('?');
                    name = arr1[0];
                }
                if(item.includes('?')) {
                    url = item.split('?')[0]
                }
                saveImg(url, `E:\\WorkSpace\\Tool\\export-zip-img\\img\\${name}`)
            })
        }
    })
    console.log(anh)
})


db.close((err) => { 
    if(err) {
        console.log('Error when closing the database')
    }
});

