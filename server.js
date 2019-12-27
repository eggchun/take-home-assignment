const express = require('express');
const app = express();
const formidable = require('formidable');
const fs = require('fs');
const ExifImage = require('exif').ExifImage;

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render("upload");
})
app.get('/map', (req, res) => {
    let location = {
        lat: req.query.lat,
        lon: req.query.lon
    }
    res.render("map", {location: location});
})

app.post('/imgUpload', (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err){
            res.render("error", {
                errorT: "Form Error!!",
                errorM: "Please enter correct information."
            })
        }else {
            if (!files){
                res.render("error", {
                    errorT: "Upload Image Error!!",
                    errorM: "Image not found or image format not correctly."
                })
            }else{
                let imginfo = {
                    title: fields['title'],
                    description: fields['description'],
                    mimetype: files.photo.type, 
                    base64: base64_encode(files.photo.path)
                }
                getExif(files.photo.path, (err, exifDate) => {
                    if (err){
                        res.render("error", {
                            errorT: "EXIF Image data not found!",
                            errorM: ""
                        })
                    }else {
                        imginfo.make = exifDate.make,
                        imginfo.model = exifDate.model,
                        imginfo.date = exifDate.date,
                        imginfo.gps = exifDate.gps

                        res.render("display", {
                            img: imginfo
                        })
                    }
                })
            }
        }
    })
})

function getExif(file, callback){
    new ExifImage(file, (error, exifDate) =>{
        if (error){
            console.log("Exif Image Error!!", error);
            callback(error, null);
        }else {
            console.log("Exif Image information: ", exifDate);
            if (!exifDate){
                callback(error, null);
            }else {
                var latDegree = exifDate.gps.GPSLatitude[0];
                var latMinute = exifDate.gps.GPSLatitude[1];
                var latSecond = exifDate.gps.GPSLatitude[2];
                var latDirection = exifDate.gps.GPSLatitudeRef;
                var latFinal = ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection);

                var lonDegree = exifDate.gps.GPSLongitude[0];
                var lonMinute = exifDate.gps.GPSLongitude[1];
                var lonSecond = exifDate.gps.GPSLongitude[2];
                var lonDirection = exifDate.gps.GPSLongitudeRef;
                var lonFinal = ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);
                
                let imgData = {
                    make: exifDate.image.Make,
                    model: exifDate.image.Model,
                    date: exifDate.exif.CreateDate,
                    gps: {
                        lat: latFinal,
                        lon: lonFinal                        
                    }
                }
                callback(null, imgData);
            }
        }
    })
}

function base64_encode(file){
    let bitmap = fs.readFileSync(file);
    let binaryImg = new Buffer(bitmap).toString('base64');
    return binaryImg;
}

function ConvertDMSToDD(degrees, minutes, seconds, direction) {    
    var dd = degrees + (minutes/60) + (seconds/3600);
    
    if (direction == "S" || direction == "W") {
        dd = dd * -1; 
    }    
    return dd;
}

app.listen(process.env.PORT || 8099);